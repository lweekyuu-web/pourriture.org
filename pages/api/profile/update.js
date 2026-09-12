import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../../lib/prisma';
import { moderateContent } from '../../../lib/aiModeration';
import { getGifById } from '../../../lib/gifLibrary';
import { getUidFromReq } from '../../../lib/identity';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/avatars');
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ALLOWED_THEMES = new Set(['default', 'dark', 'retro', 'blue']);

function field(fields, name, fallback = '') {
  const value = fields[name];
  return Array.isArray(value) ? value[0] : value ?? fallback;
}

function detectImageType(buffer) {
  if (buffer.subarray(0, 3).toString('hex') === 'ffd8ff') return 'image/jpeg';
  if (buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

function extensionForMime(mime) {
  return { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' }[mime];
}

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const userId = getUidFromReq(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const form = new IncomingForm({
      maxFileSize: MAX_AVATAR_BYTES,
      maxFiles: 1,
      allowEmptyFiles: false,
      multiples: false,
    });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, parsedFields, parsedFiles) => err ? reject(err) : resolve([parsedFields, parsedFiles]));
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const displayName = String(field(fields, 'displayName', user.displayName || '')).trim().slice(0, 30);
    const signature = String(field(fields, 'signature', user.signature || '')).slice(0, 200);
    const bio = String(field(fields, 'bio', user.bio || '')).slice(0, 500);
    const requestedTheme = String(field(fields, 'profileTheme', user.profileTheme || 'default'));
    const profileTheme = ALLOWED_THEMES.has(requestedTheme) ? requestedTheme : 'default';

    const updateData = { displayName: displayName || null, signature: signature || null, bio: bio || null, profileTheme };

    const requestedGifId = field(fields, 'selectedGifId', null);
    const clearGif = field(fields, 'clearGif', 'false') === 'true';
    if (clearGif) {
      updateData.selectedGifId = null;
    } else if (requestedGifId) {
      const libraryGif = getGifById(String(requestedGifId));
      if (!libraryGif) return res.status(400).json({ message: 'Unknown or unavailable GIF.' });

      const profileGif = await prisma.profileGif.upsert({
        where: { userId_gifId: { userId, gifId: libraryGif.id } },
        update: { gifUrl: libraryGif.url, gifTitle: libraryGif.title, category: libraryGif.category, active: true, status: 'APPROVED' },
        create: { userId, gifId: libraryGif.id, gifUrl: libraryGif.url, gifTitle: libraryGif.title, category: libraryGif.category, active: true, status: 'APPROVED' },
      });
      updateData.selectedGifId = profileGif.id;
    }

    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
    if (avatarFile) {
      const tempPath = avatarFile.filepath;
      const fileBuffer = await fs.readFile(tempPath);
      if (fileBuffer.length > MAX_AVATAR_BYTES) return res.status(413).json({ message: 'Avatar is too large. Maximum size is 2 MB.' });

      const detectedMime = detectImageType(fileBuffer);
      if (!detectedMime || !ALLOWED_MIMES.has(detectedMime) || (avatarFile.mimetype && avatarFile.mimetype !== detectedMime)) {
        return res.status(400).json({ message: 'The uploaded file is not a valid supported image.' });
      }

      const modResult = await moderateContent({
        type: 'avatar',
        data: fileBuffer,
        metadata: { mimeType: detectedMime },
      }, userId);

      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const fileName = `${userId}_${Date.now()}${extensionForMime(detectedMime)}`;
      const uploadPath = path.join(UPLOAD_DIR, fileName);
      await fs.copyFile(tempPath, uploadPath);

      let avatarStatus = 'REVIEW_REQUIRED';
      if (modResult.action === 'AUTO_APPROVE') avatarStatus = 'APPROVED';
      if (modResult.action === 'AUTO_REJECT') avatarStatus = 'REJECTED';

      const avatar = await prisma.avatar.create({
        data: {
          userId,
          fileName,
          url: `/uploads/avatars/${fileName}`,
          size: fileBuffer.length,
          mimeType: detectedMime,
          status: avatarStatus,
          moderationNote: modResult.aiResult?.reasons?.join('; ') || null,
        },
      });

      const aiReview = await prisma.aIModerationResult.create({
        data: {
          targetType: 'avatar',
          targetId: avatar.id,
          userId,
          decision: modResult.aiResult.decision,
          confidence: modResult.aiResult.confidence,
          reasons: modResult.aiResult.reasons || [],
          flaggedKeywords: modResult.aiResult.flaggedKeywords || [],
          details: JSON.stringify({ action: modResult.action }),
          aiModel: 'heuristic-moderation-v1',
        },
      });

      await prisma.avatar.update({ where: { id: avatar.id }, data: { aiReviewId: aiReview.id } });
      updateData.avatarId = avatar.id;

      await prisma.moderationLog.create({
        data: {
          action: `AVATAR_${avatarStatus}`,
          targetType: 'avatar',
          targetId: avatar.id,
          targetUserId: userId,
          reason: modResult.aiResult?.reasons?.join('; ') || 'Avatar submitted for moderation',
          aiDecisionUsed: true,
          newState: JSON.stringify({ status: avatarStatus, decision: modResult.aiResult.decision, confidence: modResult.aiResult.confidence }),
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { avatar: true, profileGif: true, customizations: true },
    });

    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    const status = error?.code === 'LIMIT_FILE_SIZE' ? 413 : 500;
    return res.status(status).json({ message: status === 413 ? 'Avatar is too large.' : 'Error updating profile' });
  }
}
