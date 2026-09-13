import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'GET') return res.status(405).end();

  const users = await prisma.user.findMany({
    select: { anonId: true, displayName: true, role: true, lastLoginAt: true, lastLoginIp: true },
    orderBy: { lastLoginAt: 'desc' },
    take: 100,
  });

  return res.status(200).json({ users: JSON.parse(JSON.stringify(users)) });
}
