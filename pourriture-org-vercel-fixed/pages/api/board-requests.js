import prisma from '../../lib/prisma';
import { getUidFromReq } from '../../lib/identity';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { boardId, name, description, rules, reason } = req.body;
  if (!/^\/[a-z0-9_-]+\/$/.test(String(boardId || ''))) return res.status(400).json({ error: 'Board ID must look like /example/' });
  if (!name?.trim() || !description?.trim()) return res.status(400).json({ error: 'Name and description are required.' });
  const existing = await prisma.board.findUnique({ where: { id: boardId } });
  if (existing) return res.status(400).json({ error: 'That board already exists.' });
  const pending = await prisma.boardRequest.findFirst({ where: { boardId, status: 'pending' } });
  if (pending) return res.status(400).json({ error: 'A request for that board is already pending.' });
  const uid = getUidFromReq(req);
  const user = uid ? await prisma.user.findUnique({ where: { id: uid } }) : null;
  const request = await prisma.boardRequest.create({
    data: { boardId, name: name.trim(), description: description.trim(), rules: rules?.trim() || null, reason: reason?.trim() || null, requesterAnonId: user?.anonId || null },
  });
  return res.status(201).json({ ok: true, id: request.id });
}
