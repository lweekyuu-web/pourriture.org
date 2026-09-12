// Données de démonstration entièrement fictives.
// Aucun personnage réel, aucun message provenant d'un vrai forum.
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function anonId() { return crypto.randomBytes(3).toString('hex').toUpperCase(); }
function postNum() { return 'n.' + (10000000 + Math.floor(Math.random() * 89999999)); }

async function main() {
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

  const users = [
    { anonId: anonId(), displayName: 'HollowFreak', badge: 'Veteran' },
    { anonId: anonId(), displayName: '99copecell', badge: 'Newbie' },
    { anonId: anonId(), displayName: 'YanderDev', badge: 'Moderator' },
    { anonId: anonId(), displayName: 'GlitchToast', badge: 'Newbie' },
  ];
  const dbUsers = [];
  for (const u of users) {
    dbUsers.push(await prisma.user.create({ data: u }));
  }

  // Thread 1 sur /v/ : dispute de jeu vidéo classique, fictive et inoffensive
  const t1 = await prisma.thread.create({
    data: {
      boardId: '/v/',
      subject: 'the new patch ruined the game',
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[0].displayName, authorId: dbUsers[0].id,
            content: 'they nerfed the only build that was fun to play, why do devs do this every single time' },
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id,
            content: 'skill issue honestly, the build was busted and you know it' },
          { postNumber: postNum(), displayName: dbUsers[0].displayName, authorId: dbUsers[0].id,
            content: 'ok but the replacement meta is just as broken so what did they even fix' },
        ],
      },
    },
  });

  // Thread 2 sur /x/ : petite théorie bizarre, ambiance "vieux forum" mais inoffensive
  const t2 = await prisma.thread.create({
    data: {
      boardId: '/x/',
      subject: 'does anyone else feel like time moves weird at night',
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[3].displayName, authorId: dbUsers[3].id,
            content: 'every time its past 2am i feel like im in a different version of the day. anyone else get this' },
          { postNumber: postNum(), displayName: 'Anonymous',
            content: 'yeah its called being tired and online too much, go to sleep' },
          { postNumber: postNum(), displayName: dbUsers[2].displayName, authorId: dbUsers[2].id,
            content: 'this thread again lol. its a known phenomenon, look up "second wind" circadian stuff' },
        ],
      },
    },
  });

  // Thread 3 sur /ph/ : philosophie amateur, absurde mais inoffensive
  await prisma.thread.create({
    data: {
      boardId: '/ph/',
      subject: 'what if the internet forgets us slower than we forget it',
      posts: {
        create: [
          { postNumber: postNum(), displayName: 'Anonymous',
            content: 'old threads like this just sit here forever while the people who wrote them move on completely' },
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id,
            content: 'thats kind of the whole vibe of this site tbh' },
        ],
      },
    },
  });

  // Thread verrouillé pour montrer la fonctionnalité de modération
  await prisma.thread.create({
    data: {
      boardId: '/t/',
      subject: '[locked] read the rules before posting',
      locked: true,
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[2].displayName, authorId: dbUsers[2].id,
            content: 'locking this, duplicate of the pinned thread. use search next time.' },
        ],
      },
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
