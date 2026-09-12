import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { anonId: id }] },
      select: {
        id: true,
        anonId: true,
        displayName: true,
        createdAt: true,
        postCount: true,
        badge: true,
        bannerUrl: true,
        signature: true,
        bio: true,
        profileTheme: true,
        avatar: { select: { id: true, url: true, status: true, moderationNote: true } },
        profileGif: { select: { id: true, gifUrl: true, gifTitle: true, category: true, active: true, status: true } },
        customizations: { select: { theme: true, accentColor: true, showPostCount: true, showJoinDate: true, profileLayout: true } },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatar && user.avatar.status !== 'APPROVED') user.avatar = null;
    if (user.profileGif && (!user.profileGif.active || user.profileGif.status !== 'APPROVED')) user.profileGif = null;

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Error fetching user profile' });
  }
}
