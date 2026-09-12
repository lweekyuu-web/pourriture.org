import prisma from '../../lib/prisma';
import { generateAnonId, generateRecoveryKey, hashKey, getUidFromReq, setUidCookie } from '../../lib/identity';

export default async function handler(req, res) {
  let uid = getUidFromReq(req);
  let user = uid ? await prisma.user.findUnique({ where: { id: uid } }) : null;

  if (!user) {
    const anonId = generateAnonId();
    const recoveryKey = generateRecoveryKey();
    user = await prisma.user.create({
      data: {
        anonId,
        recoveryKeyHash: hashKey(recoveryKey, process.env.SESSION_SECRET),
      },
    });
    setUidCookie(res, user.id);
    return res.status(200).json({
      anonId: user.anonId,
      badge: user.badge,
      createdAt: user.createdAt,
      recoveryKey, // affiché une seule fois, fonctionnalité expérimentale
      isNew: true,
    });
  }

  return res.status(200).json({
    anonId: user.anonId,
    badge: user.badge,
    createdAt: user.createdAt,
    postCount: user.postCount,
    isNew: false,
  });
}
