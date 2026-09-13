import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const { userId, action } = req.body;
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (action === 'ban') {
      await prisma.user.update({ where: { id: userId }, data: { banned: true, badge: 'Banned' } });
      await prisma.moderationAction.create({ data: { action: 'ban_user', targetType: 'user', targetId: userId } });
    } else if (action === 'unban') {
      await prisma.user.update({ where: { id: userId }, data: { banned: false, badge: 'Newbie' } });
      await prisma.moderationAction.create({ data: { action: 'unban_user', targetType: 'user', targetId: userId } });
    } else if (action === 'set_role') {
      const { role } = req.body;
      if (!['user', 'moderator', 'administrator'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
      const statusMap = { user: 'Regular', moderator: 'Moderator', administrator: 'Administrator' };
      const staffBadgeMap = { user: 'Newbie', moderator: 'Moderator', administrator: 'Administrator' };
      const shouldReplaceStaffBadge = ['Newbie', 'Moderator', 'Administrator', 'Banned'].includes(target.badge);
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role, status: statusMap[role], ...(shouldReplaceStaffBadge ? { badge: staffBadgeMap[role] } : {}) },
      });
      await prisma.moderationAction.create({ data: { action: 'set_role', targetType: 'user', targetId: userId, reason: `role: ${role}` } });
      return res.status(200).json({ ok: true, user: updated });
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
