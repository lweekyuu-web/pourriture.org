import prisma from '../../../../lib/prisma';
import { checkModPermission } from '../../../../lib/permissions';
import { getUidFromReq } from '../../../../lib/identity';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    if (!(await checkModPermission(req))) return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.query;
    const { action, decision, notes } = req.body || {};
    const moderatorId = getUidFromReq(req);
    const review = await prisma.aIModerationResult.findUnique({ where: { id }, include: { avatar: true } });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const normalizedDecision = decision || ({ APPROVE_ANYWAY: 'APPROVED', REJECT: 'REJECTED', REMOVE: 'REJECTED', FALSE_POSITIVE: 'FALSE_POSITIVE', REQUEST_REVIEW: 'UNCERTAIN' }[action]);
    const isUserAction = ['WARN_USER', 'SUSPEND_USER'].includes(action);

    if (normalizedDecision && !['APPROVED','REJECTED','FALSE_POSITIVE','UNCERTAIN'].includes(normalizedDecision)) {
      return res.status(400).json({ message: 'Invalid moderation decision' });
    }

    if (normalizedDecision) {
      await prisma.aIModerationResult.update({
        where: { id },
        data: { reviewedAt: new Date(), reviewedBy: moderatorId, reviewDecision: normalizedDecision, reviewNotes: notes || null },
      });
    }

    if (review.avatar && normalizedDecision) {
      const newStatus = normalizedDecision === 'REJECTED' ? 'REJECTED' : normalizedDecision === 'UNCERTAIN' ? 'REVIEW_REQUIRED' : 'APPROVED';
      await prisma.avatar.update({
        where: { id: review.avatar.id },
        data: { status: newStatus, moderatedAt: new Date(), moderatedBy: moderatorId, moderationNote: notes || review.avatar.moderationNote },
      });
      if (action === 'REMOVE') {
        await prisma.user.updateMany({ where: { avatarId: review.avatar.id }, data: { avatarId: null } });
      }
    }

    if (action === 'WARN_USER') {
      await prisma.warning.create({ data: { userId: review.userId, reason: notes || 'Warning issued from AI moderation review', duration: '7d', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), moderatorId } });
    }

    if (action === 'SUSPEND_USER') {
      await prisma.user.update({ where: { id: review.userId }, data: { status: 'Suspended', suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    }

    await prisma.moderationLog.create({
      data: {
        moderatorId,
        action: action || `AI_REVIEW_${normalizedDecision}`,
        targetType: review.targetType,
        targetId: review.targetId,
        targetUserId: review.userId,
        reason: notes || null,
        previousState: JSON.stringify({ aiDecision: review.decision, confidence: review.confidence, avatarStatus: review.avatar?.status || null }),
        newState: JSON.stringify({ decision: normalizedDecision || null, action: action || null }),
        aiDecisionUsed: false,
      },
    });

    const updated = await prisma.aIModerationResult.findUnique({ where: { id }, include: { avatar: { select: { id: true, url: true, userId: true, status: true } } } });
    return res.status(200).json({ ...updated, action: action || null });
  } catch (error) {
    console.error('Error updating AI review:', error);
    return res.status(500).json({ message: 'Error updating review' });
  }
}
