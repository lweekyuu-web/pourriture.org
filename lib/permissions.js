const prisma = require('./prisma');
const { isAdminRequest } = require('./admin');
const { getUidFromReq } = require('./identity');

const ALL_PERMISSIONS = ['VIEW_REPORTS','MODERATE_POSTS','LOCK_THREADS','BAN_USERS','EDIT_RULES','MANAGE_MODERATORS','MANAGE_BOARDS','REVIEW_AI'];

async function isModeratorReq(req) {
  if (isAdminRequest(req)) return true;
  const uid = getUidFromReq(req);
  if (!uid) return false;
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (!user) return false;
  if (user.role === 'moderator' || user.role === 'administrator') return true;
  return !!(await prisma.boardModerator.findFirst({ where: { userId: uid } }));
}

async function hasPermission(req, boardId, permission) {
  if (isAdminRequest(req)) return true;
  const uid = getUidFromReq(req);
  if (!uid) return false;
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (!user) return false;
  if (user.role === 'administrator') return true;
  if (user.role !== 'moderator') return false;
  if (!boardId) return ['VIEW_REPORTS','MODERATE_POSTS','LOCK_THREADS','REVIEW_AI'].includes(permission);
  const boardMod = await prisma.boardModerator.findUnique({ where: { boardId_userId: { boardId, userId: uid } } });
  return !!boardMod && boardMod.permissions.includes(permission);
}

async function checkModPermission(reqOrCookies) {
  const req = reqOrCookies && reqOrCookies.headers ? reqOrCookies : { headers: { cookie: '' } };
  if (!req.headers.cookie && reqOrCookies) {
    const cookies = reqOrCookies;
    req.headers.cookie = Object.entries(cookies).map(([k,v]) => `${k}=${encodeURIComponent(v || '')}`).join('; ');
  }
  return isModeratorReq(req);
}

module.exports = { ALL_PERMISSIONS, isModeratorReq, hasPermission, checkModPermission };
