// Auth admin volontairement simple pour un prototype local.
// NE PAS utiliser tel quel en production publique.
const crypto = require('crypto');
const cookie = require('cookie');
const ADMIN_COOKIE = 'pourriture_admin';

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail loudly instead of silently falling back to a guessable default.
    throw new Error(
      'SESSION_SECRET is not set. Define it in .env.base44-defaults / /run/base44/app.env before starting the app.'
    );
  }
  return secret;
}

// The cookie must never contain SESSION_SECRET itself -- SESSION_SECRET is
// also used elsewhere (recovery-key hashing), so leaking it via the cookie
// would let anyone forge recovery keys, not just spoof an admin session.
// Instead we store a one-way HMAC derived from it.
function sessionToken() {
  const secret = requireSecret();
  return crypto.createHmac('sha256', secret).update('pourriture-admin-session').digest('hex');
}

function isAdminRequest(req) {
  const parsed = cookie.parse(req.headers.cookie || '');
  const provided = parsed[ADMIN_COOKIE];
  if (!provided) return false;
  const expected = sessionToken();
  // Constant-time compare to avoid trivial timing side-channels.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function setAdminCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 6,
  }));
}

function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(ADMIN_COOKIE, '', { path: '/', maxAge: 0 }));
}

module.exports = { isAdminRequest, setAdminCookie, clearAdminCookie, ADMIN_COOKIE };
