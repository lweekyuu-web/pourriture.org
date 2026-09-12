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
    const hasPermission = await checkModPermission(req.cookies);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const logs = await prisma.moderationLog.findMany({
      include: {
        moderator: {
          select: {
            displayName: true,
            anonId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ message: 'Error fetching logs' });
  }
}

async function handlePost(req, res) {
  try {
    const hasPermission = await checkModPermission(req.cookies);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { action, targetType, targetId, reason } = req.body;
    const moderatorId = req.cookies?.pourriture_uid;

    const log = await prisma.moderationLog.create({
      data: {
        moderatorId,
        action,
        targetType,
        targetId,
        targetUserId: targetId,
        reason,
        aiDecisionUsed: false,
      },
    });

    return res.status(201).json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    return res.status(500).json({ message: 'Error creating log' });
  }
}
