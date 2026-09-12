// Auth admin volontairement simple pour un prototype local.
// NE PAS utiliser tel quel en production publique.
const cookie = require('cookie');
const ADMIN_COOKIE = 'pourriture_admin';

function isAdminRequest(req) {
  const parsed = cookie.parse(req.headers.cookie || '');
  return parsed[ADMIN_COOKIE] === process.env.SESSION_SECRET;
}

function setAdminCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(ADMIN_COOKIE, process.env.SESSION_SECRET, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 6,
  }));
}

function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(ADMIN_COOKIE, '', { path: '/', maxAge: 0 }));
}

module.exports = { isAdminRequest, setAdminCookie, clearAdminCookie, ADMIN_COOKIE };
