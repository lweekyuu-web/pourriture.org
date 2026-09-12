// Filtre de modération basique pour le prototype.
// Volontairement centré sur les menaces directes, l'incitation à l'automutilation
// et le harcèlement explicite (doxxing), plutôt qu'une liste exhaustive d'insultes.
// L'admin peut étendre BANNED_PATTERNS selon les besoins réels du site.
const prisma = require('./prisma');

const BANNED_PATTERNS = [
  /\bkys\b/i,
  /kill\s+yourself/i,
  /go\s+(and\s+)?(cut|hurt)\s+yourself/i,
  /i(?:'|’)?m?\s*(going to|gonna|will)\s+(kill|hurt|find|hunt)\s+you/i,
  /i\s+know\s+where\s+you\s+live/i,
  /your\s+(home\s+)?address\s+is/i,
  /i\s+have\s+your\s+(address|number|location)/i,
];

function containsBannedContent(text) {
  if (!text) return false;
  return BANNED_PATTERNS.some((re) => re.test(text));
}

const FLOOD_WINDOW_MS = 60 * 1000; // fenêtre de 60s
const FLOOD_MAX_POSTS = 5; // max 5 posts/replies par fenêtre

// Vérifie si un utilisateur (identifié par son cookie anonyme) a dépassé
// la limite de posts sur la fenêtre de temps définie.
async function isFlooding(uid) {
  if (!uid) return false; // sans identité (cookies bloqués), on ne peut pas suivre — laissé passer
  const since = new Date(Date.now() - FLOOD_WINDOW_MS);
  const count = await prisma.post.count({
    where: { authorId: uid, createdAt: { gte: since } },
  });
  return count >= FLOOD_MAX_POSTS;
}

// Vérifie si l'utilisateur associé à ce cookie est banni ou suspendu.
async function isBanned(uid) {
  if (!uid) return false;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return false;
  if (user.banned) return true;
  if (user.suspendedUntil && user.suspendedUntil > new Date()) return true;
  return false;
}

// Retourne le statut de bannissement/suspension avec raison.
async function getBanStatus(uid) {
  if (!uid) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return null;
  if (user.banned) return { type: 'banned', message: 'This identity has been banned from posting.' };
  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    return { type: 'suspended', message: `Suspended until ${user.suspendedUntil.toISOString().slice(0, 10)}.` };
  }
  return null;
}

module.exports = {
  containsBannedContent,
  isFlooding,
  isBanned,
  getBanStatus,
  FLOOD_WINDOW_MS,
  FLOOD_MAX_POSTS,
};
