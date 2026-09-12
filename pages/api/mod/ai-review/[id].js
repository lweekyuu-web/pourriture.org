import prisma from '../../../../lib/prisma';
import { checkModPermission } from '../../../../lib/permissions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const hasPermission = await checkModPermission(req.cookies);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.query;
    const { decision, notes } = req.body;
    const moderatorId = req.cookies?.pourriture_uid;

    const review = await prisma.aIModerationResult.update({
      where: { id },
      data: {
        reviewedAt: new Date(),
        reviewedBy: moderatorId,
        reviewDecision: decision,
        reviewNotes: notes,
      },
      include: {
        avatar: true,
      },
    });

    if (review.avatar) {
      let newStatus = 'PENDING';
      if (decision === 'APPROVED') {
        newStatus = 'APPROVED';
      } else if (decision === 'REJECTED') {
        newStatus = 'REJECTED';
      } else if (decision === 'FALSE_POSITIVE') {
        newStatus = 'APPROVED';
      }

      await prisma.avatar.update({
        where: { id: review.avatar.id },
        data: { status: newStatus },
      });

      await prisma.moderationLog.create({
        data: {
          moderatorId,
          action: `AI_REVIEW_${decision}`,
          targetType: 'avatar',
          targetId: review.avatar.id,
          targetUserId: review.avatar.userId,
          reason: notes,
          aiDecisionUsed: false,
        },
      });
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error('Error updating AI review:', error);
    return res.status(500).json({ message: 'Error updating review' });
  }
}
