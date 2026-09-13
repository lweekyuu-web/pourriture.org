import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

function clean(value, max) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const messages = await prisma.directMessage.findMany({
      orderBy: { createdAt: 'desc' }, take: 200,
      include: { sender: { select: { id: true, anonId: true, displayName: true, badge: true } } },
    });
    return res.status(200).json({ messages });
  }

  if (req.method === 'PATCH') {
    const id = Number(req.body?.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid message id.' });
    const message = await prisma.directMessage.update({ where: { id }, data: { readAt: new Date() } });
    return res.status(200).json({ ok: true, messageId: message.id });
  }

  if (req.method === 'POST') {
    const recipientId = clean(req.body?.recipientId, 100);
    const subject = clean(req.body?.subject, 100) || 'Reply';
    const content = clean(req.body?.content, 2000);
    if (!recipientId || !content) return res.status(400).json({ error: 'Recipient and message are required.' });
    const admin = await prisma.user.findFirst({ where: { role: 'administrator', status: { not: 'deleted' } }, orderBy: { createdAt: 'asc' } });
    if (!admin) return res.status(503).json({ error: 'No administrator configured.' });
    const message = await prisma.directMessage.create({ data: { senderId: admin.id, recipientId, subject, content } });
    return res.status(200).json({ ok: true, messageId: message.id });
  }

  return res.status(405).end();
}
