import prisma from '../../../lib/prisma';
import { generatePostNumber, getUidFromReq } from '../../../lib/identity';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { threadId, name, message, replyToId } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  if (thread.locked) return res.status(403).json({ error: 'Thread locked' });

  const uid = getUidFromReq(req);

  const post = await prisma.post.create({
    data: {
      postNumber: generatePostNumber(),
      threadId,
      displayName: name?.trim() || 'Anonymous',
      content: message,
      replyToId: replyToId || null,
      authorId: uid || null,
    },
  });

  if (uid) {
    await prisma.user.update({ where: { id: uid }, data: { postCount: { increment: 1 } } });
  }

  return res.status(201).json({ post: JSON.parse(JSON.stringify(post)) });
}
