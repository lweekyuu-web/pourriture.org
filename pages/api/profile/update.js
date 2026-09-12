import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../../lib/prisma';
import { moderateContent } from '../../../lib/aiModeration';
import { getGifById } from '../../../lib/gifLibrary';
import { getUidFromReq } from '../../../lib/identity';

export const config = { api: { bodyParser: false } };

const UPLOAD_ROOT = path.join(process.cwd(), 'public/uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
const BANNER_DIR = path.join(UPLOAD_ROOT, 'banners');
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_BANNER_BYTES = 3 * 1024 * 1024;
const MAX_BANNER_WIDTH = 900;
const MAX_BANNER_HEIGHT = 180;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ALLOWED_THEMES = new Set(['default', 'dark', 'retro', 'blue']);
const ALLOWED_LAYOUTS = new Set(['standard', 'compact', 'classic']);

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

function imageDimensions(buffer, mime) {
  if (mime === 'image/png' && buffer.length >= 24) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (mime === 'image/gif' && buffer.length >= 10) return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  if (mime === 'image/webp' && buffer.length >= 30) {
    const chunk = buffer.subarray(12, 16).toString('ascii');
    if (chunk === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (mime === 'image/jpeg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (!length) break;
      offset += 2 + length;
    }
  }
  return null;
}

async function parseImage(file, maxBytes, maxWidth, maxHeight) {
  const buffer = await fs.readFile(file.filepath);
  if (buffer.length > maxBytes) throw Object.assign(new Error('FILE_TOO_LARGE'), { status: 413 });
  const detectedMime = detectImageType(buffer);
  if (!detectedMime || !ALLOWED_MIMES.has(detectedMime) || (file.mimetype && file.mimetype !== detectedMime)) {
    throw Object.assign(new Error('INVALID_IMAGE'), { status: 400 });
  }
  const dimensions = imageDimensions(buffer, detectedMime);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > maxWidth || dimensions.height > maxHeight) {
    throw Object.assign(new Error('INVALID_DIMENSIONS'), { status: 400 });
  }
  return { buffer, detectedMime, dimensions };
}

async function saveModeratedImage({ file, userId, kind, maxBytes, maxWidth, maxHeight, directory, publicPrefix }) {
  const parsed = await parseImage(file, maxBytes, maxWidth, maxHeight);
  const modResult = await moderateContent({ type: kind, data: parsed.buffer, metadata: { mimeType: parsed.detectedMime } }, userId);
  let status = 'REVIEW_REQUIRED';
  if (modResult.action === 'AUTO_APPROVE') status = 'APPROVED';
  if (modResult.action === 'AUTO_REJECT') status = 'REJECTED';

  await fs.mkdir(directory, { recursive: true });
  const fileName = `${userId}_${Date.now()}${extensionForMime(parsed.detectedMime)}`;
  await fs.copyFile(file.filepath, path.join(directory, fileName));

  return { parsed, modResult, status, fileName, url: `${publicPrefix}/${fileName}` };
}

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const userId = getUidFromReq(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const form = new IncomingForm({ maxFileSize: MAX_BANNER_BYTES, maxFiles: 2, allowEmptyFiles: false, multiples: false });
    const [fields, files] = await new Promise((resolve, reject) => form.parse(req, (err, parsedFields, parsedFiles) => err ? reject(err) : resolve([parsedFields, parsedFiles])));
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const displayName = String(field(fields, 'displayName', user.displayName || '')).trim().slice(0, 30);
    const signature = String(field(fields, 'signature', user.signature || '')).slice(0, 200);
    const bio = String(field(fields, 'bio', user.bio || '')).slice(0, 500);
    const profileTheme = ALLOWED_THEMES.has(String(field(fields, 'profileTheme', user.profileTheme || 'default'))) ? String(field(fields, 'profileTheme', user.profileTheme || 'default')) : 'default';
    const layout = ALLOWED_LAYOUTS.has(String(field(fields, 'profileLayout', 'standard'))) ? String(field(fields, 'profileLayout', 'standard')) : 'standard';
    const showPostCount = field(fields, 'showPostCount', 'true') === 'true';
    const showJoinDate = field(fields, 'showJoinDate', 'true') === 'true';

    const updateData = { displayName: displayName || null, signature: signature || null, bio: bio || null, profileTheme };

    const requestedBadge = String(field(fields, 'badge', '')).trim();
    if (requestedBadge) {
      const badge = await prisma.badge.findUnique({ where: { name: requestedBadge } });
      if (!badge) return res.status(400).json({ message: 'Unknown badge.' });
      updateData.badge = badge.name;
    }

    const requestedGifId = field(fields, 'selectedGifId', null);
    if (field(fields, 'clearGif', 'false') === 'true') updateData.selectedGifId = null;
    else if (requestedGifId) {
      const libraryGif = getGifById(String(requestedGifId));
      if (!libraryGif) return res.status(400).json({ message: 'Unknown or unavailable GIF.' });
      const profileGif = await prisma.profileGif.upsert({
        where: { userId_gifId: { userId, gifId: libraryGif.id } },
        update: { gifUrl: libraryGif.url, gifTitle: libraryGif.title, category: libraryGif.category, active: true, status: 'APPROVED' },
        create: { userId, gifId: libraryGif.id, gifUrl: libraryGif.url, gifTitle: libraryGif.title, category: libraryGif.category, active: true, status: 'APPROVED' },
      });
      updateData.selectedGifId = profileGif.id;
    }

    const customization = await prisma.profileCustomization.upsert({
      where: { userId },
      update: { theme: profileTheme, profileLayout: layout, showPostCount, showJoinDate },
      create: { userId, theme: profileTheme, profileLayout: layout, showPostCount, showJoinDate },
    });

    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
    if (avatarFile) {
      const result = await saveModeratedImage({ file: avatarFile, userId, kind: 'avatar', maxBytes: MAX_AVATAR_BYTES, maxWidth: 512, maxHeight: 512, directory: AVATAR_DIR, publicPrefix: '/uploads/avatars' });
      const avatar = await prisma.avatar.create({ data: { userId, fileName: result.fileName, url: result.url, size: result.parsed.buffer.length, mimeType: result.parsed.detectedMime, width: result.parsed.dimensions.width, height: result.parsed.dimensions.height, status: result.status, moderationNote: result.modResult.aiResult?.reasons?.join('; ') || null } });
      const aiReview = await prisma.aIModerationResult.create({ data: { targetType: 'avatar', targetId: avatar.id, userId, decision: result.modResult.aiResult.decision, confidence: result.modResult.aiResult.confidence, reasons: result.modResult.aiResult.reasons || [], flaggedKeywords: result.modResult.aiResult.flaggedKeywords || [], details: JSON.stringify({ action: result.modResult.action }), aiModel: 'heuristic-moderation-v1' } });
      await prisma.avatar.update({ where: { id: avatar.id }, data: { aiReviewId: aiReview.id } });
      updateData.avatarId = avatar.id;
      await prisma.moderationLog.create({ data: { action: `AVATAR_${result.status}`, targetType: 'avatar', targetId: avatar.id, targetUserId: userId, reason: result.modResult.aiResult?.reasons?.join('; ') || 'Avatar submitted for moderation', aiDecisionUsed: true, newState: JSON.stringify({ status: result.status, decision: result.modResult.aiResult.decision, confidence: result.modResult.aiResult.confidence }) } });
    }

    const bannerFile = Array.isArray(files.banner) ? files.banner[0] : files.banner;
    if (bannerFile) {
      const result = await saveModeratedImage({ file: bannerFile, userId, kind: 'banner', maxBytes: MAX_BANNER_BYTES, maxWidth: MAX_BANNER_WIDTH, maxHeight: MAX_BANNER_HEIGHT, directory: BANNER_DIR, publicPrefix: '/uploads/banners' });
      if (result.status === 'APPROVED') updateData.bannerUrl = result.url;
      await prisma.moderationLog.create({ data: { action: `BANNER_${result.status}`, targetType: 'banner', targetId: result.fileName, targetUserId: userId, reason: result.modResult.aiResult?.reasons?.join('; ') || 'Profile banner submitted for moderation', aiDecisionUsed: true, newState: JSON.stringify({ status: result.status, decision: result.modResult.aiResult.decision, confidence: result.modResult.aiResult.confidence }) } });
    }

    const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData, include: { avatar: true, profileGif: true, customizations: true } });
    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser, customization });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error?.message === 'FILE_TOO_LARGE' || error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Image is too large.' });
    if (error?.message === 'INVALID_DIMENSIONS') return res.status(400).json({ message: 'Image dimensions are outside the allowed limits.' });
    if (error?.message === 'INVALID_IMAGE') return res.status(400).json({ message: 'The uploaded file is not a valid supported image.' });
    return res.status(500).json({ message: 'Error updating profile' });
  }
}
