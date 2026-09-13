import prisma from '../../../lib/prisma';

const VALID_REASONS = [
  'Spam / flood',
  'Harassment',
  'Illegal / prohibited content',
  'Personal information',
  'Self-harm concern',
  'Other',
];

function clean(value, max) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const postId = Number(req.body?.postId);
  const reason = clean(req.body?.reason, 80);
  const details = clean(req.body?.details, 1000);
  if (!Number.isInteger(postId) || postId < 1) return res.status(400).json({ error: 'Invalid post.' });
  if (!VALID_REASONS.includes(reason)) return res.status(400).json({ error: 'Invalid report reason.' });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const recentDuplicate = await prisma.report.findFirst({
    where: { postId, reason, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    select: { id: true },
  });
  if (recentDuplicate) return res.status(409).json({ error: 'A recent report for this post and reason already exists.' });

  const report = await prisma.report.create({
    data: { postId, reason, details: details || null },
  });
  return res.status(201).json({ ok: true, reportId: report.id });
}
