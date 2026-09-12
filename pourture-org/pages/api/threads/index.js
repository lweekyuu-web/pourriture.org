import prisma from '../../../lib/prisma';
import { generatePostNumber, getUidFromReq } from '../../../lib/identity';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { boardId, name, subject, message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board || board.status === 'disabled') return res.status(400).json({ error: 'Invalid board' });

  const uid = getUidFromReq(req);

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
