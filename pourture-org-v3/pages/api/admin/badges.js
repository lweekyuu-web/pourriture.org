import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'POST') {
    const { name, color, description, level, requirement } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
    const existing = await prisma.badge.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Badge name already exists' });
    const badge = await prisma.badge.create({
      data: { name, color: color || '#808080', description, level: parseInt(level) || 0, requirement },
    });
    return res.status(201).json(badge);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await prisma.badge.delete({ where: { id: parseInt(id, 10) } });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
