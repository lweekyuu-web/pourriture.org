import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
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

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      [field]: keepImage ? 'approved' : 'rejected',
      [aiField]: false,
      ...(keepImage ? {} : { [urlField]: null }),
    },
  });

  return res.status(200).json({ ok: true, id: updated.id, action, type });
}
