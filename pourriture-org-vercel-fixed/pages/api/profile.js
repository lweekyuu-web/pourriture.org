import prisma from '../../lib/prisma';
import { getUidFromReq } from '../../lib/identity';

const THEMES = new Set(['classic', 'blue', 'green', 'gray']);
const LAYOUTS = new Set(['compact', 'profile']);
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

  if (!validImageUrl(avatarUrl) || !validImageUrl(bannerUrl)) {
    return res.status(400).json({ error: 'Avatar and banner URLs must use HTTPS.' });
  }
  if (!validGifUrl(profileGifUrl)) {
    return res.status(400).json({ error: 'Profile GIFs must come from GIPHY over HTTPS.' });
  }

  const updated = await prisma.user.update({
    where: { id: uid },
    data: { displayName: displayName || null, bio: bio || null, signature: signature || null, avatarUrl: avatarUrl || null, bannerUrl: bannerUrl || null, profileTheme, profileLayout, profileGifUrl: profileGifUrl || null },
  });

  return res.status(200).json({ ok: true, anonId: updated.anonId });
}
