import prisma from '../../../lib/prisma';
import { generatePostNumber, getUidFromReq } from '../../../lib/identity';
import { containsBannedContent, isFlooding, isBanned } from '../../../lib/moderation';

function isAllowedGif(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && /(^|\.)giphy\.com$/.test(parsed.hostname);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { threadId, name, message, replyToId, gifUrl } = req.body;
  if ((!message || !message.trim()) && !gifUrl) return res.status(400).json({ error: 'Message or GIF required' });
  if (gifUrl && !isAllowedGif(gifUrl)) return res.status(400).json({ error: 'Only GIFs returned by the configured GIF provider are allowed.' });

  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  if (thread.locked || thread.archived) return res.status(403).json({ error: 'Thread is closed' });

  const uid = getUidFromReq(req);
  if (await isBanned(uid)) return res.status(403).json({ error: 'This identity has been banned from posting.' });
  if (await isFlooding(uid)) return res.status(429).json({ error: 'You are posting too fast. Please slow down.' });

  const cleanMessage = String(message || '').trim();
  if (cleanMessage && containsBannedContent(cleanMessage)) {
    return res.status(400).json({ error: 'Your message was rejected by the content filter.' });
  }

  const heldForReview = Boolean(gifUrl);
  const post = await prisma.post.create({
    data: {
      postNumber: generatePostNumber(),
      threadId,
      displayName: name?.trim() || 'Anonymous',
      content: cleanMessage,
      gifUrl: gifUrl || null,
      replyToId: replyToId || null,
      authorId: uid || null,
      hidden: heldForReview,
      status: heldForReview ? 'review' : 'active',
    },
  });

  await prisma.thread.update({ where: { id: threadId }, data: { bumpedAt: new Date() } });
  if (uid) await prisma.user.update({ where: { id: uid }, data: { postCount: { increment: 1 } } });

  return res.status(201).json({
    post: JSON.parse(JSON.stringify(post)),
    review: heldForReview,
  });
}
