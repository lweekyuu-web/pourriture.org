import { setAdminCookie } from '../../../lib/admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    setAdminCookie(res);
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
}
