import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../../lib/prisma';
import { moderateContent } from '../../../lib/aiModeration';
import { verifyCookie } from '../../../lib/admin';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/avatars');

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify user session
    const userId = req.cookies?.pourriture_uid;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      displayName: fields.displayName?.[0] || user.displayName,
      signature: fields.signature?.[0] || user.signature,
      bio: fields.bio?.[0] || user.bio,
      profileTheme: fields.profileTheme?.[0] || user.profileTheme,
      selectedGifId: fields.selectedGifId?.[0] || user.selectedGifId,
    };

    // Handle avatar upload
    if (files.avatar?.[0]) {
      const file = files.avatar[0];
      const tempPath = file.filepath;
      const fileBuffer = await fs.readFile(tempPath);

      // AI Moderation
      const modResult = await moderateContent(
        {
          type: 'avatar',
          data: fileBuffer,
          metadata: {
            mimeType: file.mimetype,
            width: file.width,
            height: file.height,
          },
        },
        userId
      );

      // Generate filename
      const fileName = `${userId}_${Date.now()}${path.extname(file.originalFilename)}`;
      const uploadPath = path.join(UPLOAD_DIR, fileName);

      // Ensure upload directory exists
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.copyFile(tempPath, uploadPath);

      // Determine avatar status
      let avatarStatus = 'PENDING';
      if (modResult.action === 'AUTO_APPROVE') {
        avatarStatus = 'APPROVED';
      } else if (modResult.action === 'AUTO_REJECT') {
        avatarStatus = 'REJECTED';
      }

      // Create/update avatar
      const avatar = await prisma.avatar.create({
        data: {
          userId,
          fileName,
          url: `/uploads/avatars/${fileName}`,
          size: fileBuffer.length,
          mimeType: file.mimetype,
          status: avatarStatus,
          moderationNote: modResult.aiResult?.reasons?.join('; '),
          aiReview: {
            create: {
              targetType: 'avatar',
              targetId: 'pending', // Will be updated after avatar creation
              userId,
              decision: modResult.aiResult.decision,
              confidence: modResult.aiResult.confidence,
              reasons: modResult.aiResult.reasons,
              flaggedKeywords: modResult.aiResult.flaggedKeywords,
              aiModel: 'default-moderation-v1',
            },
          },
        },
      });

      updateData.avatarId = avatar.id;

      // Log the action
      await prisma.moderationLog.create({
        data: {
          action: 'AVATAR_UPLOADED',
          targetType: 'avatar',
          targetId: avatar.id,
          targetUserId: userId,
          reason: 'Avatar uploaded for moderation',
          aiDecisionUsed: true,
          newState: JSON.stringify({
            status: avatarStatus,
            fileName,
          }),
        },
      });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        avatar: true,
        profileGif: true,
      },
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      message: 'Error updating profile',
      error: error.message,
    });
  }
}
