import prisma from '../../../lib/prisma';
import { generatePostNumber, getUidFromReq } from '../../../lib/identity';
import { containsBannedContent, isFlooding, isBanned } from '../../../lib/moderation';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { threadId, name, message, replyToId } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

…    await prisma.user.update({ where: { id: uid }, data: { postCount: { increment: 1 } } });
  }

  return res.status(201).json({ post: JSON.parse(JSON.stringify(post)) });
}
