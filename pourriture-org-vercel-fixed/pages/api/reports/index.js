import prisma from '../../../lib/prisma';

const VALID_REASONS = ['Spam', 'Harassment', 'Hate speech', 'Threat', 'Self-harm', 'Other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { postId, reason, details } = req.body;
  if (!VALID_REASONS.includes(reason)) return res.status(400).json({ error: 'Invalid reason' });

  const report = await prisma.report.create({
    data: { postId, reason, details: details || null },
  });
  return res.status(201).json(report);
}
