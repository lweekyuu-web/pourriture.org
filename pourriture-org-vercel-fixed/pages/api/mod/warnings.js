import prisma from '../../../lib/prisma';
import { isModeratorReq } from '../../../lib/permissions';
import { getUidFromReq } from '../../../lib/identity';

export default async function handler(req, res) {
  const isMod = await isModeratorReq(req);
  if (!isMod) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, reason, duration } = req.body;
  const uid = getUidFromReq(req);

  if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason required' });

  let expiresAt = null;
  if (duration === '24h') expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  else if (duration === '3d') expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  else if (duration === '7d') expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  else if (duration === 'permanent') expiresAt = null;

  const warning = await prisma.warning.create({
    data: { userId, reason, duration, expiresAt, moderatorId: uid },
  });

  // Suspend the user for the duration
  if (duration === 'permanent') {
    await prisma.user.update({ where: { id: userId }, data: { banned: true, badge: 'Banned', status: 'Banned' } });
  } else if (expiresAt) {
    await prisma.user.update({ where: { id: userId }, data: { suspendedUntil: expiresAt, status: 'Suspended' } });
  }

  await prisma.moderationAction.create({
    data: { moderatorId: uid, action: 'issue_warning', targetType: 'user', targetId: userId, reason },
  });

  return res.status(201).json(warning);
}
