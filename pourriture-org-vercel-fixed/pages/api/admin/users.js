import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

const ADMIN_PERMISSIONS = [
  'DASHBOARD', 'USERS', 'BADGES', 'BOARDS', 'BOARD_REQUESTS', 'MODERATION',
  'REPORTS', 'PROFILE_MEDIA', 'SECURITY', 'WIDGETS', 'SETTINGS', 'STATISTICS',
];

async function userWithBadges(id) {
  const user = await prisma.user.findUnique({ where: { id }, include: { badges: { include: { badge: true }, orderBy: { assignedAt: 'asc' } } } });
  if (!user) return null;
  return { ...user, assignedBadges: user.badges.map((x) => x.badge) };
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { badges: { include: { badge: true }, orderBy: { assignedAt: 'asc' } } } });
    return res.status(200).json(users.map((u) => ({ ...u, assignedBadges: u.badges.map((x) => x.badge) })));
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
        data: {
          role,
          status: statusMap[role],
          ...(shouldReplaceStaffBadge ? { badge: staffBadgeMap[role] } : {}),
          ...(role !== 'administrator' ? { adminTitle: null, adminPermissions: [] } : {}),
        },
      });
      await prisma.moderationAction.create({ data: { action: 'set_role', targetType: 'user', targetId: userId, reason: `role: ${role}` } });
      return res.status(200).json({ ok: true, user: await userWithBadges(updated.id) });
    } else if (action === 'set_admin_access') {
      if (target.role !== 'administrator') return res.status(400).json({ error: 'User must be an administrator first.' });
      const requested = Array.isArray(req.body.adminPermissions) ? req.body.adminPermissions : [];
      const adminPermissions = [...new Set(requested.filter((p) => ADMIN_PERMISSIONS.includes(p)))];
      const adminTitle = typeof req.body.adminTitle === 'string' ? req.body.adminTitle.trim().slice(0, 40) : '';
      const updated = await prisma.user.update({ where: { id: userId }, data: { adminTitle: adminTitle || null, adminPermissions } });
      await prisma.moderationAction.create({ data: { action: 'set_admin_access', targetType: 'user', targetId: userId, reason: `title: ${adminTitle || 'none'}; permissions: ${adminPermissions.join(',') || 'none'}` } });
      return res.status(200).json({ ok: true, user: await userWithBadges(updated.id) });
    } else if (action === 'add_badge' || action === 'remove_badge') {
      const badgeId = Number(req.body.badgeId);
      if (!Number.isInteger(badgeId)) return res.status(400).json({ error: 'Badge not found' });
      const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
      if (!badge) return res.status(404).json({ error: 'Badge not found' });
      if (target.role === 'administrator' && action === 'remove_badge' && badge.name === 'Administrator') return res.status(403).json({ error: 'Administrator badge is protected.' });
      if (action === 'add_badge') await prisma.userBadge.upsert({ where: { userId_badgeId: { userId: target.id, badgeId } }, update: {}, create: { userId: target.id, badgeId } });
      else await prisma.userBadge.deleteMany({ where: { userId: target.id, badgeId } });
      await prisma.moderationAction.create({ data: { action: action === 'add_badge' ? 'assign_badge' : 'remove_badge', targetType: 'user', targetId: target.id, reason: `badge: ${badge.name}` } });
      return res.status(200).json({ ok: true, user: await userWithBadges(target.id), badge });
    } else if (action === 'assign_badge') {
      const badgeId = req.body.badgeId;
      if (badgeId === null || badgeId === '' || typeof badgeId === 'undefined') return res.status(400).json({ error: 'Choose a badge to add or remove.' });
      const badge = await prisma.badge.findUnique({ where: { id: parseInt(badgeId, 10) } });
      if (!badge) return res.status(404).json({ error: 'Badge not found' });
      await prisma.userBadge.upsert({ where: { userId_badgeId: { userId: target.id, badgeId: badge.id } }, update: {}, create: { userId: target.id, badgeId: badge.id } });
      const updated = await userWithBadges(target.id);
      return res.status(200).json({ ok: true, user: updated, badge });
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }
    return res.status(200).json({ ok: true, user: await userWithBadges(target.id) });
  }

  res.status(405).end();
}
