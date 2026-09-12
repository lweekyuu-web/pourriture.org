import prisma from '../../../lib/prisma';
import { checkModPermission } from '../../../lib/permissions';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleGet(req, res) {
  try {
    // Check permissions
    const hasPermission = await checkModPermission(req.cookies);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const reviews = await prisma.aIModerationResult.findMany({
      include: {
        avatar: {
          select: {
            id: true,
            url: true,
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Transform for frontend
    const transformed = reviews.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      userId: r.userId,
      targetUrl: r.avatar?.url,
      decision: r.decision,
      confidence: r.confidence,
      reasons: r.reasons,
      flaggedKeywords: r.flaggedKeywords,
      reviewedAt: r.reviewedAt,
      reviewDecision: r.reviewDecision,
      reviewNotes: r.reviewNotes,
    }));

    return res.status(200).json(transformed);
  } catch (error) {
    console.error('Error fetching AI reviews:', error);
    return res.status(500).json({ message: 'Error fetching reviews' });
  }
}

async function handlePost(req, res) {
  try {
    const hasPermission = await checkModPermission(req.cookies);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { reviewId, decision, notes } = req.body;
    const moderatorId = req.cookies?.pourriture_uid;

    const review = await prisma.aIModerationResult.update({
      where: { id: reviewId },
      data: {
        reviewedAt: new Date(),
        reviewedBy: moderatorId,
        reviewDecision: decision, // APPROVED | REJECTED | FALSE_POSITIVE | UNCERTAIN
        reviewNotes: notes,
      },
      include: {
        avatar: true,
      },
    });

    // Apply decision to avatar
    if (review.avatar) {
      let avatarStatus = 'PENDING';
      if (decision === 'APPROVED') {
        avatarStatus = review.decision === 'SAFE' ? 'APPROVED' : 'REJECTED';
      } else if (decision === 'REJECTED') {
        avatarStatus = 'REJECTED';
      } else if (decision === 'FALSE_POSITIVE') {
        avatarStatus = 'APPROVED';
      }

      await prisma.avatar.update({
        where: { id: review.avatar.id },
        data: { status: avatarStatus },
      });

      // Log action
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
    console.error('Error updating review:', error);
    return res.status(500).json({ message: 'Error updating review' });
  }
}
