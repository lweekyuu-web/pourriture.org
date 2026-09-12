import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const thread = await prisma.thread.findUnique({
    where: { id: parseInt(req.query.id, 10) },
    include: { posts: { orderBy: { createdAt: 'asc' } }, board: true },
  });
  if (!thread) return res.status(404).json({ error: 'not found' });
  return res.status(200).json(thread);
}
