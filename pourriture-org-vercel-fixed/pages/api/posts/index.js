import prisma from '../../../lib/prisma';
import { generatePostNumber, getUidFromReq } from '../../../lib/identity';
import { containsBannedContent, isFlooding, isBanned } from '../../../lib/moderation';

function isAllowedGif(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && /(^|\.)giphy\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

async function moderateInput(message, gifUrl) {
  if (!process.env.OPENAI_API_KEY) return { textFlagged: false, gifFlagged: false, aiAvailable: false };
  try {
    const input = [];
    if (message) input.push({ type: 'text', text: message });
    if (gifUrl) input.push({ type: 'image_url', image_url: { url: gifUrl } });
    if (!input.length) return { textFlagged: false, gifFlagged: false, aiAvailable: true };
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'omni-moderation-latest', input }),
    });
    if (!response.ok) return { textFlagged: false, gifFlagged: false, aiAvailable: false };
    const data = await response.json();
    const results = data.results || [];
    let textFlagged = false;
    let gifFlagged = false;
    input.forEach((item, index) => {
      if (!results[index]?.flagged) return;
      if (item.type === 'text') textFlagged = true;
      if (item.type === 'image_url') gifFlagged = true;
    });
    return { textFlagged, gifFlagged, aiAvailable: true };
  } catch (_) {
    return { textFlagged: false, gifFlagged: false, aiAvailable: false };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { threadId, message, replyToId, gifUrl } = req.body;
  if ((!message || !String(message).trim()) && !gifUrl) return res.status(400).json({ error: 'Message or GIF required' });
  if (gifUrl && !isAllowedGif(gifUrl)) return res.status(400).json({ error: 'Only GIFs returned by the configured GIF provider are allowed.' });

  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  if (thread.locked || thread.archived) return res.status(403).json({ error: 'Thread is closed' });

  const uid = getUidFromReq(req);
  if (await isBanned(uid)) return res.status(403).json({ error: 'This identity has been banned from posting.' });
  if (await isFlooding(uid)) return res.status(429).json({ error: 'You are posting too fast. Please slow down.' });

  const cleanMessage = String(message || '').trim().slice(0, 5000);
  if (cleanMessage && containsBannedContent(cleanMessage)) return res.status(400).json({ error: 'Your message was rejected by the content filter.' });

  let replyTarget = null;
  if (replyToId !== null && typeof replyToId !== 'undefined' && replyToId !== '') {
    const parsedReplyId = Number(replyToId);
    if (!Number.isInteger(parsedReplyId)) return res.status(400).json({ error: 'Invalid reply target.' });
    replyTarget = await prisma.post.findFirst({ where: { id: parsedReplyId, threadId }, select: { id: true } });
    if (!replyTarget) return res.status(400).json({ error: 'Reply target is not in this thread.' });
  }

  const ai = await moderateInput(cleanMessage, gifUrl);
  const aiNeedsReview = !ai.aiAvailable && Boolean(gifUrl);
  const heldForReview = ai.textFlagged || ai.gifFlagged || aiNeedsReview;
  const reviewReason = ai.textFlagged || ai.gifFlagged
    ? 'AI moderation flagged this submission; moderator review required.'
    : (aiNeedsReview ? 'GIF moderation is unavailable; moderator review required.' : null);

  let authorDisplayName = 'Anonymous';
  if (uid) {
    const author = await prisma.user.findUnique({ where: { id: uid }, select: { displayName: true } });
    if (author?.displayName?.trim()) authorDisplayName = author.displayName.trim();
  }

  const post = await prisma.post.create({
    data: {
      postNumber: generatePostNumber(),
      threadId,
      displayName: authorDisplayName,
      content: cleanMessage,
      gifUrl: gifUrl || null,
      replyToId: replyTarget?.id || null,
      authorId: uid || null,
      hidden: heldForReview,
      status: heldForReview ? 'review' : 'active',
    },
  });

  await prisma.thread.update({ where: { id: threadId }, data: { bumpedAt: new Date() } });
  if (uid) await prisma.user.update({ where: { id: uid }, data: { postCount: { increment: 1 } } });

  const postWithAuthor = await prisma.post.findUnique({
    where: { id: post.id },
    include: { author: { select: { anonId: true, displayName: true, badge: true, avatarUrl: true, avatarStatus: true, profileNameColor: true, profileNameStyle: true } } },
  });

  return res.status(201).json({ post: JSON.parse(JSON.stringify(postWithAuthor)), review: heldForReview, reviewReason, aiModerated: ai.aiAvailable });
}
