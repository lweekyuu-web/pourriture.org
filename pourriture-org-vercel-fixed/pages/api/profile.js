import prisma from '../../lib/prisma';
import { getUidFromReq } from '../../lib/identity';

const THEMES = new Set(['classic', 'blue', 'green', 'gray', 'red', 'purple']);
const LAYOUTS = new Set(['compact', 'profile', 'imageboard']);
const MAX = { displayName: 32, bio: 500, signature: 160, url: 500 };

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function validImageUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname.length > 0;
  } catch (_) {
    return false;
  }
}

function validGifUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && /(^|\.)giphy\.com$/i.test(u.hostname);
  } catch (_) {
    return false;
  }
}

async function moderateImageUrl(url) {
  if (!url) return { status: 'approved', flagged: false };
  if (!process.env.OPENAI_API_KEY) return { status: 'review', flagged: false, reason: 'AI moderation is not configured; moderator review required.' };
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: [{ type: 'image_url', image_url: { url } }] }),
    });
    if (!response.ok) return { status: 'review', flagged: false, reason: 'AI moderation failed; moderator review required.' };
    const data = await response.json();
    const result = data.results?.[0];
    if (!result) return { status: 'review', flagged: false, reason: 'AI moderation returned no result.' };
    return result.flagged
      ? { status: 'review', flagged: true, reason: 'AI flagged this image; moderator review required.' }
      : { status: 'approved', flagged: false };
  } catch (_) {
    return { status: 'review', flagged: false, reason: 'AI moderation was unavailable; moderator review required.' };
  }
}

export default async function handler(req, res) {
  const uid = getUidFromReq(req);
  if (!uid) return res.status(401).json({ error: 'Identity required' });

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || user.banned) return res.status(403).json({ error: 'Account unavailable' });

  if (req.method === 'GET') {
    return res.status(200).json({
      anonId: user.anonId,
      displayName: user.displayName || '',
      bio: user.bio || '',
      signature: user.signature || '',
      avatarUrl: user.avatarUrl || '',
      bannerUrl: user.bannerUrl || '',
      avatarStatus: user.avatarStatus,
      bannerStatus: user.bannerStatus,
      profileTheme: user.profileTheme,
      profileLayout: user.profileLayout,
      profileGifUrl: user.profileGifUrl || '',
      badge: user.badge,
      status: user.status,
    });
  }

  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const displayName = cleanText(body.displayName, MAX.displayName);
  const bio = cleanText(body.bio, MAX.bio);
  const signature = cleanText(body.signature, MAX.signature);
  const avatarUrl = cleanText(body.avatarUrl, MAX.url);
  const bannerUrl = cleanText(body.bannerUrl, MAX.url);
  const profileGifUrl = cleanText(body.profileGifUrl, MAX.url);
  const profileTheme = THEMES.has(body.profileTheme) ? body.profileTheme : 'classic';
  const profileLayout = LAYOUTS.has(body.profileLayout) ? body.profileLayout : 'compact';

  if (!validImageUrl(avatarUrl) || !validImageUrl(bannerUrl)) return res.status(400).json({ error: 'Avatar and banner URLs must use HTTPS.' });
  if (!validGifUrl(profileGifUrl)) return res.status(400).json({ error: 'Profile GIFs must come from GIPHY over HTTPS.' });

  const avatarChanged = avatarUrl !== (user.avatarUrl || '');
  const bannerChanged = bannerUrl !== (user.bannerUrl || '');
  const avatarReview = avatarChanged ? await moderateImageUrl(avatarUrl) : { status: user.avatarStatus, flagged: user.avatarAiFlagged };
  const bannerReview = bannerChanged ? await moderateImageUrl(bannerUrl) : { status: user.bannerStatus, flagged: user.bannerAiFlagged };

  const updated = await prisma.user.update({
    where: { id: uid },
    data: {
      displayName: displayName || null,
      bio: bio || null,
      signature: signature || null,
      avatarUrl: avatarUrl || null,
      bannerUrl: bannerUrl || null,
      avatarStatus: avatarUrl ? avatarReview.status : 'approved',
      bannerStatus: bannerUrl ? bannerReview.status : 'approved',
      avatarAiFlagged: avatarUrl ? !!avatarReview.flagged : false,
      bannerAiFlagged: bannerUrl ? !!bannerReview.flagged : false,
      profileTheme,
      profileLayout,
      profileGifUrl: profileGifUrl || null,
    },
  });

  return res.status(200).json({ ok: true, anonId: updated.anonId, avatarStatus: updated.avatarStatus, bannerStatus: updated.bannerStatus, notice: avatarReview.reason || bannerReview.reason || null });
}
