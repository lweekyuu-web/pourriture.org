import prisma from '../../../lib/prisma';
import { generatePostNumber, getUidFromReq } from '../../../lib/identity';
import { containsBannedContent, isFlooding, isBanned } from '../../../lib/moderation';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { boardId, name, subject, message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board || board.status === 'disabled') return res.status(400).json({ error: 'Invalid board' });

  const uid = getUidFromReq(req);

  if (await isBanned(uid)) {
    return res.status(403).json({ error: 'This identity has been banned from posting.' });
  }

  if (await isFlooding(uid)) {
    return res.status(429).json({ error: 'You are posting too fast. Please slow down.' });
  }

  if (containsBannedContent(message) || (subject && containsBannedContent(subject))) {
    return res.status(400).json({ error: 'Your message was rejected by the content filter.' });
  }

  const thread = await prisma.thread.create({
    data: {
      boardId,
      subject: subject || null,
      posts: {
        create: {
          postNumber: generatePostNumber(),
          displayName: name?.trim() || 'Anonymous',
          content: message,
          authorId: uid || null,
        },
      },
    },
  });

  if (uid) {
    await prisma.user.update({ where: { id: uid }, data: { postCount: { increment: 1 } } });
  }

  return res.status(201).json({ threadId: thread.id });
}
