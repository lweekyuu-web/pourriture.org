import prisma from '../../lib/prisma';
import { getUidFromReq } from '../../lib/identity';

function clean(v, max) { return String(v || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max); }
export default async function handler(req, res) {
  const uid = getUidFromReq(req);
  if (!uid) return res.status(401).json({ error: 'Identity required.' });
  const me = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
  if (!me) return res.status(401).json({ error: 'Identity required.' });
  if (req.method === 'GET') {
    const messages = await prisma.directMessage.findMany({ where: { OR: [{ senderId: uid }, { recipientId: uid }] }, orderBy: { createdAt: 'asc' }, take: 200, include: { sender: { select: { id: true, anonId: true, displayName: true, badge: true } }, recipient: { select: { id: true, anonId: true, displayName: true, badge: true } } } });
    await prisma.directMessage.updateMany({ where: { recipientId: uid, readAt: null }, data: { readAt: new Date() } });
    return res.json({ meId: uid, messages: messages.map(m => ({ ...m, meId: uid, other: m.senderId === uid ? m.recipient : m.sender })) });
  }
  if (req.method === 'POST') {
    const anonId = clean(req.body?.anonId, 20); const content = clean(req.body?.content, 2000);
    const recipient = await prisma.user.findUnique({ where: { anonId }, select: { id: true, banned: true, status: true } });
    if (!recipient || recipient.status === 'deleted') return res.status(404).json({ error: 'User not found.' });
    if (recipient.id === uid) return res.status(400).json({ error: 'You cannot message yourself.' });
    if (!content) return res.status(400).json({ error: 'Message is empty.' });
    const message = await prisma.directMessage.create({ data: { senderId: uid, recipientId: recipient.id, subject: 'Contact', content } });
    return res.status(201).json({ ok: true, messageId: message.id });
  }
  return res.status(405).end();
}
