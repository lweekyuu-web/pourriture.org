import prisma from '../../../lib/prisma';
import { hashKey, setUidCookie } from '../../../lib/identity';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const recoveryKey = typeof req.body?.recoveryKey === 'string' ? req.body.recoveryKey.trim() : '';
  if (!/^[a-f0-9]{32}$/i.test(recoveryKey)) {
    return res.status(400).json({ error: 'Enter your 32-character recovery key.' });
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ error: 'Identity recovery is not configured.' });

  const recoveryKeyHash = hashKey(recoveryKey, secret);
  const user = await prisma.user.findFirst({ where: { recoveryKeyHash } });

  if (!user) return res.status(401).json({ error: 'Recovery key not recognized.' });
  if (user.banned || user.status === 'banned') return res.status(403).json({ error: 'This identity is banned.' });
  if (user.status === 'deleted') return res.status(403).json({ error: 'This identity is no longer available.' });

  setUidCookie(res, user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return res.status(200).json({
    anonId: user.anonId,
    displayName: user.displayName,
    badge: user.badge,
    postCount: user.postCount,
  });
}
