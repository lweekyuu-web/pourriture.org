import prisma from '../../../lib/prisma';
import { isModeratorReq } from '../../../lib/permissions';
import { getUidFromReq } from '../../../lib/identity';

export default async function handler(req, res) {
  const isMod = await isModeratorReq(req);
  if (!isMod) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();

  const { action, postId, threadId, userId, reportId } = req.body;
  const uid = getUidFromReq(req);

  const log = async (act, targetType, targetId, reason) => {
    await prisma.moderationAction.create({
      data: { moderatorId: uid, action: act, targetType, targetId: String(targetId), reason },
    });
  };

  if (action === 'hide_post') {
    await prisma.post.update({ where: { id: postId }, data: { hidden: true, status: 'hidden' } });
    await log('hide_post', 'post', postId);
  } else if (action === 'restore_post') {
    await prisma.post.update({ where: { id: postId }, data: { hidden: false, status: 'active' } });
    await log('restore_post', 'post', postId);
  } else if (action === 'delete_post') {
    await prisma.post.delete({ where: { id: postId } });
    await log('delete_post', 'post', postId);
  } else if (action === 'lock_thread') {
    await prisma.thread.update({ where: { id: threadId }, data: { locked: true } });
    await log('lock_thread', 'thread', threadId);
  } else if (action === 'unlock_thread') {
    await prisma.thread.update({ where: { id: threadId }, data: { locked: false } });
    await log('unlock_thread', 'thread', threadId);
  } else if (action === 'sticky_thread') {
    await prisma.thread.update({ where: { id: threadId }, data: { sticky: true } });
    await log('sticky_thread', 'thread', threadId);
  } else if (action === 'unsticky_thread') {
    await prisma.thread.update({ where: { id: threadId }, data: { sticky: false } });
    await log('unsticky_thread', 'thread', threadId);
  } else if (action === 'archive_thread') {
    await prisma.thread.update({ where: { id: threadId }, data: { archived: true, locked: true } });
    await log('archive_thread', 'thread', threadId);
  } else if (action === 'unarchive_thread') {
    await prisma.thread.update({ where: { id: threadId }, data: { archived: false, locked: false } });
    await log('unarchive_thread', 'thread', threadId);
  } else if (action === 'ban_user') {
    await prisma.user.update({ where: { id: userId }, data: { banned: true, badge: 'Banned', status: 'Banned' } });
    await log('ban_user', 'user', userId);
  } else if (action === 'unban_user') {
    await prisma.user.update({ where: { id: userId }, data: { banned: false, badge: 'Newbie', status: 'Regular' } });
    await log('unban_user', 'user', userId);
  } else if (action === 'resolve_report') {
    await prisma.report.update({ where: { id: reportId }, data: { status: 'resolved', resolvedAt: new Date(), resolvedBy: uid } });
    await log('resolve_report', 'report', reportId);
  } else if (action === 'dismiss_report') {
    await prisma.report.update({ where: { id: reportId }, data: { status: 'dismissed', resolvedAt: new Date(), resolvedBy: uid } });
    await log('dismiss_report', 'report', reportId);
  } else {
    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(200).json({ ok: true });
}
