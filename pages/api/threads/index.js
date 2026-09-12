import prisma from '../../../lib/prisma';
import { generatePostNumber, getUidFromReq } from '../../../lib/identity';
import { containsBannedContent, isFlooding, isBanned } from '../../../lib/moderation';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { boardId, name, subject, message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

…  });

  if (uid) {
    await prisma.user.update({ where: { id: uid }, data: { postCount: { increment: 1 } } });
  }

  return res.status(201).json({ threadId: thread.id });
}
