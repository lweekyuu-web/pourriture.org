import prisma from '../../../lib/prisma';
import { isModeratorReq } from '../../../lib/permissions';

export default async function handler(req, res) {
  if (!(await isModeratorReq(req))) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'GET') {
    const badges = await prisma.badge.findMany({ orderBy: [{ level: 'asc' }, { name: 'asc' }] });
    return res.status(200).json(badges);
  }

  if (req.method === 'POST') {
    const { userId, badgeId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Empty badgeId removes the custom badge and restores the normal Newbie label.
    if (badgeId === null || badgeId === '' || typeof badgeId === 'undefined') {
      const updated = await prisma.user.update({ where: { id: userId }, data: { badge: 'Newbie' } });
      await prisma.moderationAction.create({
        data: { action: 'remove_badge', targetType: 'user', targetId: userId },
      });
      return res.status(200).json({ user: updated });
    }

    const badge = await prisma.badge.findUnique({ where: { id: parseInt(badgeId, 10) } });
    if (!badge) return res.status(404).json({ error: 'Badge not found' });

    const updated = await prisma.user.update({ where: { id: userId }, data: { badge: badge.name } });
    await prisma.moderationAction.create({
      data: {
        action: 'assign_badge',
        targetType: 'user',
        targetId: userId,
        reason: `badge: ${badge.name}`,
      },
    });

    return res.status(200).json({ user: updated, badge });
  }

  res.status(405).end();
}
