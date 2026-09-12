import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const id = parseInt(req.query.id, 10);
  const widget = await prisma.widget.findUnique({ where: { id } });
  if (!widget) return res.status(404).send('Not found');

  prisma.widget.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => {});

  const dest = widget.linkUrl || '/';
  res.writeHead(302, { Location: dest });
  res.end();
}
