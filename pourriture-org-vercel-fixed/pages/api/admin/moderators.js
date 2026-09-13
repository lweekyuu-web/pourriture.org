import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'POST') {
    const { boardId, userId, permissions } = req.body || {};
    if (!boardId || !userId) return res.status(400).json({ error: 'Board and user required' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const existing = await prisma.boardModerator.findUnique({ where: { boardId_userId: { boardId, userId } } });
    if (existing) return res.status(400).json({ error: 'Already a moderator for this board' });
    const safePermissions = Array.isArray(permissions) ? permissions.filter((p) => ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS', 'BAN_USERS', 'EDIT_RULES', 'MANAGE_MODERATORS', 'MANAGE_BOARDS'].includes(p)) : ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS'];
    const mod = await prisma.boardModerator.create({ data: { boardId, userId, permissions: safePermissions }, include: { user: true, board: true } });
    // A board assignment promotes a normal user to moderator, but never downgrades an administrator.
    if (user.role === 'user') await prisma.user.update({ where: { id: userId }, data: { role: 'moderator', status: 'Moderator', badge: user.badge === 'Newbie' ? 'Moderator' : user.badge } });
    await prisma.moderationAction.create({ data: { action: 'assign_board_moderator', targetType: 'user', targetId: userId, reason: `board: ${boardId}` } });
    return res.status(201).json(mod);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    const existing = await prisma.boardModerator.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });
    await prisma.boardModerator.delete({ where: { id } });
    await prisma.moderationAction.create({ data: { action: 'remove_board_moderator', targetType: 'user', targetId: existing.userId, reason: `board: ${existing.boardId}` } });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
