import { isAdminRequest } from '../../../lib/admin';
import { getAllSettings, setSettings } from '../../../lib/settings';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'GET') {
    const settings = await getAllSettings();
    return res.status(200).json(settings);
  }

  if (req.method === 'POST') {
    await setSettings(req.body || {});
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
