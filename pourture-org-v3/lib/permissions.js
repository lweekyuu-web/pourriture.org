// Permission system for board moderators and administrators.
const prisma = require('./prisma');

const ALL_PERMISSIONS = [
  'VIEW_REPORTS',
  'MODERATE_POSTS',
  'LOCK_THREADS',
  'BAN_USERS',
  'EDIT_RULES',
  'MANAGE_MODERATORS',
  'MANAGE_BOARDS',
];

// Check if a request is from an admin (full access).
function isAdminReq(req) {
  const { isAdminRequest } = require('./admin');
  return isAdminRequest(req);
}

// Check if a request is from a moderator or admin (mod space access).
async function isModeratorReq(req) {
  if (isAdminReq(req)) return true;
  // Check if user has a moderator role or is assigned to any board
  const { getUidFromReq } = require('./identity');
  const uid = getUidFromReq(req);
  if (!uid) return false;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return false;
  if (user.role === 'moderator' || user.role === 'administrator') return true;
  const boardMod = await prisma.boardModerator.findFirst({ where: { userId: uid } });
  return !!boardMod;
}

// Check if a user has a specific permission for a board.
async function hasPermission(req, boardId, permission) {
  if (isAdminReq(req)) return true;
  const { getUidFromReq } = require('./identity');
  const uid = getUidFromReq(req);
  if (!uid) return false;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return false;
  if (user.role === 'administrator') return true;
  if (user.role === 'moderator') {
    // Board moderators have specific permissions
    const boardMod = await prisma.boardModerator.findUnique({
      where: { boardId_userId: { boardId, userId: uid } },
    });
    if (boardMod) return boardMod.permissions.includes(permission);
    // Global moderators have basic permissions
    return ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS'].includes(permission);
  }
  return false;
}

module.exports = {
  ALL_PERMISSIONS,
  isAdminReq,
  isModeratorReq,
  hasPermission,
};
