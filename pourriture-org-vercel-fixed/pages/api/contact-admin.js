import prisma from '../../lib/prisma';
import { getUidFromReq } from '../../lib/identity';

function clean(value, max) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const senderId = getUidFromReq(req);
  if (!senderId) return res.status(401).json({ error: 'Create or recover your forum identity first.' });

  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  if (!sender || sender.banned || sender.status === 'deleted') return res.status(403).json({ error: 'This account cannot send messages.' });

  const subject = clean(req.body?.subject, 100) || 'Contact';
  const content = clean(req.body?.content, 2000);
  if (!content) return res.status(400).json({ error: 'Message cannot be empty.' });

  const admin = await prisma.user.findFirst({ where: { role: 'administrator', status: { not: 'deleted' } }, orderBy: { createdAt: 'asc' } });
  if (!admin) return res.status(503).json({ error: 'No site administrator is configured yet.' });
  if (admin.id === sender.id) return res.status(400).json({ error: 'You are the site administrator.' });

  const message = await prisma.directMessage.create({
    data: { senderId: sender.id, recipientId: admin.id, subject, content },
  });

  return res.status(200).json({ ok: true, messageId: message.id });
}
