import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'POST') {
    const { boardId, userId, permissions } = req.body;
    if (!boardId || !userId) return res.status(400).json({ error: 'Board and user required' });
    const existing = await prisma.boardModerator.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    if (existing) return res.status(400).json({ error: 'Already a moderator' });
    const mod = await prisma.boardModerator.create({
      data: { boardId, userId, permissions: permissions || ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS'] },
      include: { user: true, board: true },
    });
    // Update user role
    await prisma.user.update({ where: { id: userId }, data: { role: 'moderator', status: 'Moderator' } });
    return res.status(201).json(mod);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await prisma.boardModerator.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
