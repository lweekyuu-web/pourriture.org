import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const { userId, action } = req.body;
    if (action === 'ban') {
      await prisma.user.update({ where: { id: userId }, data: { banned: true, badge: 'Banned' } });
      await prisma.moderationAction.create({
        data: { action: 'ban_user', targetType: 'user', targetId: userId },
      });
    } else if (action === 'unban') {
      await prisma.user.update({ where: { id: userId }, data: { banned: false, badge: 'Newbie' } });
      await prisma.moderationAction.create({
        data: { action: 'unban_user', targetType: 'user', targetId: userId },
      });
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
