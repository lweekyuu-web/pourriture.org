import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const posts = await prisma.post.findMany({
      where: { authorId: id },
      include: {
        thread: {
          select: {
            id: true,
            boardId: true,
            subject: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return res.status(500).json({ message: 'Error fetching posts' });
  }
}
