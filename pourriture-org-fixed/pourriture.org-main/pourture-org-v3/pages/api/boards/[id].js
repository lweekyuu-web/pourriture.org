import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  const boardId = '/' + req.query.id + '/';

  if (req.method === 'PUT') {
    const { name, description, rules, status } = req.body;
    const board = await prisma.board.update({
      where: { id: boardId },
      data: { name, description, rules, status },
    });
    return res.status(200).json(board);
  }

  if (req.method === 'DELETE') {
    await prisma.post.deleteMany({ where: { thread: { boardId } } });
    await prisma.thread.deleteMany({ where: { boardId } });
    await prisma.board.delete({ where: { id: boardId } });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
