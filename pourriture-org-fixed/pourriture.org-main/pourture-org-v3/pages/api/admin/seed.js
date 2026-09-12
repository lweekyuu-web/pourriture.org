// Permet de peupler la base de données de démo depuis le navigateur (aucun terminal requis).
// Accessible uniquement à l'admin. Idempotent-ish : peut être relancé (les boards existants sont ignorés).
import prisma from '../../../lib/prisma';
import { isAdminRequest } from '../../../lib/admin';
import crypto from 'crypto';

function anonId() { return crypto.randomBytes(3).toString('hex').toUpperCase(); }
function postNum() { return 'n.' + (10000000 + Math.floor(Math.random() * 89999999)); }

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).end();

  const boards = [
    { id: '/x/', name: 'Random', description: 'General discussion and miscellaneous topics' },
    { id: '/v/', name: 'Video Games', description: 'Games, consoles, and endless debates about them' },
    { id: '/a/', name: 'Anime & Manga', description: 'Discussion of anime and manga' },
    { id: '/t/', name: 'Technology', description: 'Hardware, software, and internet culture' },
    { id: '/p/', name: 'Art', description: 'Drawing, painting, and creative work' },
    { id: '/ph/', name: 'Philosophy', description: 'Half-baked theories at 3am' },
  ];
  for (const b of boards) {
    await prisma.board.upsert({ where: { id: b.id }, update: {}, create: b });
  }

  const existingUsers = await prisma.user.count();
  let dbUsers = [];
  if (existingUsers === 0) {
    const users = [
      { anonId: anonId(), displayName: 'HollowFreak', badge: 'Veteran' },
      { anonId: anonId(), displayName: '99copecell', badge: 'Newbie' },
      { anonId: anonId(), displayName: 'YanderDev', badge: 'Moderator' },
      { anonId: anonId(), displayName: 'GlitchToast', badge: 'Newbie' },
    ];
    for (const u of users) dbUsers.push(await prisma.user.create({ data: u }));
  }

  const existingThreads = await prisma.thread.count();
  if (existingThreads === 0 && dbUsers.length > 0) {
    await prisma.thread.create({
      data: {
        boardId: '/v/', subject: 'the new patch ruined the game',
        posts: { create: [
          { postNumber: postNum(), displayName: dbUsers[0].displayName, authorId: dbUsers[0].id,
            content: 'they nerfed the only build that was fun to play, why do devs do this every single time' },
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id,
            content: 'skill issue honestly, the build was busted and you know it' },
        ] },
      },
    });
    await prisma.thread.create({
      data: {
        boardId: '/x/', subject: 'does anyone else feel like time moves weird at night',
        posts: { create: [
          { postNumber: postNum(), displayName: dbUsers[3].displayName, authorId: dbUsers[3].id,
            content: 'every time its past 2am i feel like im in a different version of the day. anyone else get this' },
          { postNumber: postNum(), displayName: 'Anonymous',
            content: 'yeah its called being tired and online too much, go to sleep' },
        ] },
      },
    });
    await prisma.thread.create({
      data: {
        boardId: '/ph/', subject: 'what if the internet forgets us slower than we forget it',
        posts: { create: [
          { postNumber: postNum(), displayName: 'Anonymous',
            content: 'old threads like this just sit here forever while the people who wrote them move on completely' },
        ] },
      },
    });
  }

  return res.status(200).json({ ok: true, message: 'Seed applied (or already present).' });
}
