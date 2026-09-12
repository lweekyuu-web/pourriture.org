import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();

  const { action, postId, threadId, userId, reportId } = req.body;

  if (action === 'hide_post') {
    await prisma.post.update({ where: { id: postId }, data: { hidden: true } });
  } else if (action === 'delete_post') {
    await prisma.post.delete({ where: { id: postId } });
  } else if (action === 'lock_thread') {
    await prisma.thread.update({ where: { id: threadId }, data: { locked: true } });
  } else if (action === 'ban_user') {
    await prisma.user.update({ where: { id: userId }, data: { banned: true, badge: 'Banned' } });
  } else if (action === 'resolve_report') {
    await prisma.report.update({ where: { id: reportId }, data: { resolved: true } });
  } else {
    return res.status(400).json({ error: 'Unknown action' });
  }

  await prisma.moderationAction.create({
    data: { action, targetType: postId ? 'post' : threadId ? 'thread' : userId ? 'user' : 'report',
      targetId: String(postId || threadId || userId || reportId) },
  });

  return res.status(200).json({ ok: true });
}
