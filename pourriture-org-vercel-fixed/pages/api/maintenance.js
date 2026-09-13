import { getSetting } from '../../lib/settings';
import { isAdminRequest } from '../../lib/admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const enabled = (await getSetting('maintenance_mode')) === '1';
  const isAdmin = isAdminRequest(req);

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return res.status(200).json({ enabled, isAdmin });
}
