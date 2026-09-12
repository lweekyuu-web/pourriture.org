// Génération d'identités anonymes fictives pour le prototype.
// Aucune donnée réelle (email, mot de passe) n'est jamais demandée.
const crypto = require('crypto');
const cookie = require('cookie');

const COOKIE_NAME = 'pourriture_uid';

function generateAnonId() {
  // ex: A81F29
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generatePostNumber() {
  // ex: n.68305244
  return 'n.' + (10000000 + Math.floor(Math.random() * 89999999));
}

function generateRecoveryKey() {
  // clé locale fictive permettant de "retrouver" son identité sur le même appareil
  return crypto.randomBytes(16).toString('hex');
}

function hashKey(key, secret) {
  if (!secret) {
    // Don't silently fall back to a guessable default -- that would make
    // every recovery key on every unconfigured install hash the same way.
    throw new Error('hashKey() requires a secret (pass process.env.SESSION_SECRET).');
  }
  return crypto.createHmac('sha256', secret).update(key).digest('hex');
}

function getUidFromReq(req) {
  const parsed = cookie.parse(req.headers.cookie || '');
  return parsed[COOKIE_NAME] || null;
}

function setUidCookie(res, userId) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  }));
}

module.exports = {
  COOKIE_NAME,
  generateAnonId,
  generatePostNumber,
  generateRecoveryKey,
  hashKey,
  getUidFromReq,
  setUidCookie,
};
