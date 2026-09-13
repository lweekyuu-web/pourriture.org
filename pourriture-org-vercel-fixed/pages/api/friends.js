import prisma from '../../lib/prisma';
import { getUidFromReq } from '../../lib/identity';

async function currentUser(req) {
  const uid = getUidFromReq(req);
  return uid ? prisma.user.findUnique({ where: { id: uid } }) : null;
}

export default async function handler(req, res) {
  const me = await currentUser(req);
  if (!me) return res.status(401).json({ error: 'Identity required.' });

  if (req.method === 'POST') {
    const { action, anonId } = req.body || {};
    const other = await prisma.user.findUnique({ where: { anonId: String(anonId || '').trim() } });
    if (!other || other.id === me.id) return res.status(400).json({ error: 'Invalid friend.' });

    if (action === 'request') {
      const existing = await prisma.friendship.findFirst({ where: { OR: [{ requesterId: me.id, recipientId: other.id }, { requesterId: other.id, recipientId: me.id }] } });
      if (existing) return res.status(409).json({ error: existing.status === 'accepted' ? 'Already friends.' : 'A friend request already exists.' });
      const friendship = await prisma.friendship.create({ data: { requesterId: me.id, recipientId: other.id } });
      return res.json({ ok: true, friendship });
    }

    if (action === 'accept' || action === 'reject') {
      const friendship = await prisma.friendship.findFirst({ where: { requesterId: other.id, recipientId: me.id, status: 'pending' } });
      if (!friendship) return res.status(404).json({ error: 'Friend request not found.' });
      await prisma.friendship.update({ where: { id: friendship.id }, data: { status: action === 'accept' ? 'accepted' : 'rejected' } });
      return res.json({ ok: true });
    }

    if (action === 'remove') {
      const friendship = await prisma.friendship.findFirst({ where: { OR: [{ requesterId: me.id, recipientId: other.id }, { requesterId: other.id, recipientId: me.id }] } });
      if (!friendship) return res.status(404).json({ error: 'Friendship not found.' });
      await prisma.friendship.delete({ where: { id: friendship.id } });
      return res.json({ ok: true });
    }

    if (action === 'top') {
      const friendship = await prisma.friendship.findFirst({ where: { OR: [{ requesterId: me.id, recipientId: other.id }, { requesterId: other.id, recipientId: me.id }], status: 'accepted' } });
      if (!friendship) return res.status(404).json({ error: 'You must be friends first.' });
      await prisma.friendship.update({ where: { id: friendship.id }, data: { topFriend: !friendship.topFriend } });
      return res.json({ ok: true, topFriend: !friendship.topFriend });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  }

  if (req.method === 'GET') {
    const rows = await prisma.friendship.findMany({ where: { OR: [{ requesterId: me.id }, { recipientId: me.id }] }, include: { requester: { select: { anonId: true, displayName: true, avatarUrl: true } }, recipient: { select: { anonId: true, displayName: true, avatarUrl: true } } }, orderBy: { updatedAt: 'desc' } });
    const friends = rows.map((r) => ({ id: r.id, status: r.status, topFriend: r.topFriend, incoming: r.recipientId === me.id, user: r.requesterId === me.id ? r.recipient : r.requester }));
    return res.json({ friends });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
