import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();
  const { id, action } = req.body;
  const requestId = Number(id);
  const request = await prisma.boardRequest.findUnique({ where: { id: requestId } });
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  if (request.status !== 'pending') return res.status(400).json({ error: 'Request already reviewed.' });

  if (action === 'reject') {
    await prisma.boardRequest.update({ where: { id: requestId }, data: { status: 'rejected', reviewedAt: new Date() } });
    return res.status(200).json({ ok: true });
  }
  if (action === 'approve') {
    const existing = await prisma.board.findUnique({ where: { id: request.boardId } });
    if (existing) return res.status(400).json({ error: 'Board already exists.' });
    await prisma.$transaction([
      prisma.board.create({ data: { id: request.boardId, name: request.name, description: request.description, rules: request.rules, status: 'public' } }),
      prisma.boardRequest.update({ where: { id: requestId }, data: { status: 'approved', reviewedAt: new Date() } }),
    ]);
    return res.status(200).json({ ok: true });
  }
  return res.status(400).json({ error: 'Unknown action.' });
}
