import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  const id = parseInt(req.query.id, 10);

  if (req.method === 'PUT') {
    const { slot, type, imageUrl, linkUrl, altText, htmlContent, order, active } = req.body;
    const widget = await prisma.widget.update({
      where: { id },
      data: { slot, type, imageUrl, linkUrl, altText, htmlContent, order, active },
    });
    return res.status(200).json(widget);
  }

  if (req.method === 'DELETE') {
    await prisma.widget.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
