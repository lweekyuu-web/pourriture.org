import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Liste admin (tous, avec stats) si connecté en admin sans slot précisé.
    if (isAdminRequest(req) && !req.query.slot) {
      const widgets = await prisma.widget.findMany({ orderBy: [{ slot: 'asc' }, { order: 'asc' }] });
      return res.status(200).json(widgets);
    }
    return res.status(400).json({ error: 'Use lib/widgets.getWidgetsForSlot server-side for public rendering' });
  }

  if (req.method === 'POST') {
    if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
    const { slot, type, imageUrl, linkUrl, altText, htmlContent, order, active } = req.body;
    if (!slot) return res.status(400).json({ error: 'slot required' });
    const widget = await prisma.widget.create({
      data: {
        slot, type: type || 'banner', imageUrl, linkUrl, altText, htmlContent,
        order: order || 0, active: active !== false,
      },
    });
    return res.status(201).json(widget);
  }

  res.status(405).end();
}
