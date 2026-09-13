import prisma from '../../../lib/prisma';
import { isModeratorReq } from '../../../lib/permissions';
import { getUidFromReq } from '../../../lib/identity';

export default async function handler(req, res) {
  if (!(await isModeratorReq(req))) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, type, action } = req.body || {};
  if (!userId || !['avatar', 'banner'].includes(type) || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid moderation action.' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const field = type === 'avatar' ? 'avatarStatus' : 'bannerStatus';
  const urlField = type === 'avatar' ? 'avatarUrl' : 'bannerUrl';
  const aiField = type === 'avatar' ? 'avatarAiFlagged' : 'bannerAiFlagged';
  const keepImage = action === 'approve';
  const moderatorId = getUidFromReq(req);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      [field]: keepImage ? 'approved' : 'rejected',
      [aiField]: false,
      ...(keepImage ? {} : { [urlField]: null }),
    },
  });

  await prisma.moderationAction.create({
    data: {
      moderatorId,
      action: `${action}_${type}`,
      targetType: 'user_profile_media',
      targetId: userId,
      reason: keepImage ? 'Profile media approved.' : 'Profile media rejected and removed.',
    },
  });

  return res.status(200).json({ ok: true, id: updated.id, action, type });
}
