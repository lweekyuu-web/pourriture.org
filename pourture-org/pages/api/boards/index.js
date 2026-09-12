import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const admin = isAdminRequest(req);
    const boards = await prisma.board.findMany({
      where: admin ? {} : { status: 'public' },
      orderBy: { id: 'asc' },
    });
    return res.status(200).json(boards);
  }

  if (req.method === 'POST') {
    if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
    const { id, name, description, rules, status } = req.body;
    if (!/^\/[a-z0-9_-]+\/$/.test(id)) {
      return res.status(400).json({ error: 'Board ID must look like /example/' });
    }
    const existing = await prisma.board.findUnique({ where: { id } });
    if (existing) return res.status(400).json({ error: 'Board ID already exists' });

    const board = await prisma.board.create({
      data: { id, name, description, rules, status: status || 'public' },
    });
    return res.status(201).json(board);
  }

  res.status(405).end();
}
