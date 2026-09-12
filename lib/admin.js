const crypto = require('crypto');
const cookie = require('cookie');
const ADMIN_COOKIE = 'pourriture_admin';

function requireSecret() {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set.');
  return process.env.SESSION_SECRET;
}
function sessionToken() { return crypto.createHmac('sha256', requireSecret()).update('pourriture-admin-session').digest('hex'); }
function isAdminRequest(req) {
  const parsed = cookie.parse(req.headers.cookie || '');
  const provided = parsed[ADMIN_COOKIE];
  if (!provided) return false;
  const expected = sessionToken();
  const a = Buffer.from(provided), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function checkAdminCookie(cookies = {}) {
  const value = Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v || '')}`).join('; ');
  return isAdminRequest({ headers: { cookie: value } });
}
function setAdminCookie(res) { res.setHeader('Set-Cookie', cookie.serialize(ADMIN_COOKIE, sessionToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 6 })); }
function clearAdminCookie(res) { res.setHeader('Set-Cookie', cookie.serialize(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })); }

module.exports = { isAdminRequest, checkAdminCookie, setAdminCookie, clearAdminCookie, ADMIN_COOKIE, verifyCookie: isAdminRequest };
