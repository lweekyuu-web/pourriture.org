import prisma from '../../lib/prisma';
import { generateAnonId, generateRecoveryKey, hashKey, getUidFromReq, setUidCookie } from '../../lib/identity';
import { isAdminRequest } from '../../lib/admin';

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

export default async function handler(req, res) {
  const ip = getClientIp(req);
  let uid = getUidFromReq(req);
  let user = uid ? await prisma.user.findUnique({ where: { id: uid } }) : null;

  if (!user) {
    const anonId = generateAnonId();
    const recoveryKey = generateRecoveryKey();
    user = await prisma.user.create({
      data: {
        anonId,
        recoveryKeyHash: hashKey(recoveryKey, process.env.SESSION_SECRET),
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });
    setUidCookie(res, user.id);
    return res.status(200).json({
      anonId: user.anonId,
      displayName: user.displayName || '',
      badge: user.badge,
      createdAt: user.createdAt,
      recoveryKey,
      isAdmin: isAdminRequest(req),
      isNew: true,
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  });

  return res.status(200).json({
    anonId: user.anonId,
    displayName: user.displayName || '',
    badge: user.badge,
    createdAt: user.createdAt,
    postCount: user.postCount,
    isAdmin: isAdminRequest(req),
    isNew: false,
  });
}
