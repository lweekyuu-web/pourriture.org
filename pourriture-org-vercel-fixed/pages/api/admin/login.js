import { setAdminCookie } from '../../../lib/admin';
import prisma from '../../../lib/prisma';
import { getUidFromReq } from '../../../lib/identity';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body || {};
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  setAdminCookie(res);

  // The person who successfully authenticates as site admin becomes the
  // administrator attached to their existing forum identity. This avoids a
  // separate, mysterious "admin user" that cannot be found in User Management.
  const uid = getUidFromReq(req);
  if (uid) {
    await prisma.user.updateMany({
      where: { id: uid },
      data: { role: 'administrator', badge: 'Super Admin', status: 'Site administrator' },
    });
  }

  return res.status(200).json({ ok: true });
}
