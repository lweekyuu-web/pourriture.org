// Données de démonstration entièrement fictives.
// Aucun personnage réel, aucun message provenant d'un vrai forum.
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function anonId() { return crypto.randomBytes(3).toString('hex').toUpperCase(); }
function postNum() { return 'n.' + (10000000 + Math.floor(Math.random() * 89999999)); }
function daysAgo(n) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000); }
function hoursAgo(n) { return new Date(Date.now() - n * 60 * 60 * 1000); }

async function main() {
  // --- Boards ---
  const boards = [
    { id: '/x/', name: 'Random', description: 'General discussion and miscellaneous topics', rules: 'No spam\nNo threats\nNo personal information\nNo illegal content\nKeep discussions relevant' },
    { id: '/v/', name: 'Video Games', description: 'Games, consoles, and endless debates about them', rules: 'No console wars\nNo piracy links\nKeep it civil' },
    { id: '/a/', name: 'Anime & Manga', description: 'Discussion of anime and manga', rules: 'Use spoiler tags\nNo NSFW\nBe respectful' },
    { id: '/t/', name: 'Technology', description: 'Hardware, software, and internet culture', rules: 'No warez\nSearch before asking\nTech support only' },
    { id: '/p/', name: 'Art', description: 'Drawing, painting, and creative work', rules: 'Original work only\nConstructive criticism\nNo tracing' },
    { id: '/ph/', name: 'Philosophy', description: 'Half-baked theories at 3am', rules: 'Argue the idea, not the person\nNo pseudoscience' },
  ];

  for (const b of boards) {
    await prisma.board.upsert({ where: { id: b.id }, update: {}, create: b });
  }

  // --- Badges ---
  const badgeData = [
    { name: 'Newbie', color: '#808080', description: 'New to the community', level: 0, requirement: '0 posts' },
    { name: 'Regular', color: '#3366cc', description: 'Active member', level: 1, requirement: '50 posts' },
    { name: 'Veteran', color: '#008000', description: 'Long-time member', level: 2, requirement: '500 posts' },
    { name: 'Moderator', color: '#cc6600', description: 'Board moderator', level: 3, requirement: 'Appointed by admin' },
    { name: 'Admin', color: '#af0a0f', description: 'Site administrator', level: 4, requirement: 'Appointed by admin' },
    { name: 'Banned', color: '#333333', description: 'Banned user', level: -1, requirement: 'Rule violation' },
    { name: 'OP', color: '#af0a0f', description: 'Original poster', level: 0, requirement: 'Created the thread' },
    { name: 'Trusted', color: '#789922', description: 'Trusted member', level: 2, requirement: '1000 posts with no warnings' },
  ];
  for (const b of badgeData) {
    await prisma.badge.upsert({ where: { name: b.name }, update: {}, create: b });
  }

  // --- Users ---
  const users = [
    { anonId: anonId(), displayName: 'HollowFreak', badge: 'Veteran', role: 'user', status: 'Veteran', postCount: 483, createdAt: daysAgo(1200) },
    { anonId: anonId(), displayName: '99copecell', badge: 'Newbie', role: 'user', status: 'New user', postCount: 12, createdAt: daysAgo(5) },
    { anonId: anonId(), displayName: 'YanderDev', badge: 'Moderator', role: 'moderator', status: 'Moderator', postCount: 1247, createdAt: daysAgo(900) },
    { anonId: anonId(), displayName: 'GlitchToast', badge: 'Newbie', role: 'user', status: 'New user', postCount: 3, createdAt: daysAgo(2) },
    { anonId: anonId(), displayName: 'nullpointer', badge: 'Regular', role: 'user', status: 'Regular', postCount: 156, createdAt: daysAgo(400) },
    { anonId: anonId(), displayName: 'RustyBlade', badge: 'Veteran', role: 'user', status: 'Veteran', postCount: 892, createdAt: daysAgo(1500) },
    { anonId: anonId(), displayName: 'cryptid_42', badge: 'Regular', role: 'user', status: 'Regular', postCount: 67, createdAt: daysAgo(200) },
    { anonId: anonId(), displayName: 'Mod_01', badge: 'Moderator', role: 'moderator', status: 'Moderator', postCount: 2103, createdAt: daysAgo(1100) },
    { anonId: anonId(), displayName: 'banned_dude', badge: 'Banned', role: 'user', status: 'Banned', banned: true, postCount: 44, createdAt: daysAgo(300) },
    { anonId: anonId(), displayName: 'sleepy_void', badge: 'Trusted', role: 'user', status: 'Regular', postCount: 1502, createdAt: daysAgo(1800) },
  ];
  const dbUsers = [];
  for (const u of users) {
    dbUsers.push(await prisma.user.create({ data: u }));
  }

  // --- Board Moderators ---
  await prisma.boardModerator.create({
    data: { boardId: '/v/', userId: dbUsers[2].id, permissions: ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS', 'BAN_USERS'] },
  }).catch(() => {});
  await prisma.boardModerator.create({
    data: { boardId: '/x/', userId: dbUsers[7].id, permissions: ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS'] },
  }).catch(() => {});

  // --- Threads ---
  // Thread 1: /v/ — active, popular
  const t1 = await prisma.thread.create({
    data: {
      boardId: '/v/', subject: 'the new patch ruined the game', sticky: false, views: 342, bumpedAt: hoursAgo(3),
      createdAt: daysAgo(7),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[0].displayName, authorId: dbUsers[0].id, content: 'they nerfed the only build that was fun to play, why do devs do this every single time', createdAt: daysAgo(7) },
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id, content: 'skill issue honestly, the build was busted and you know it', createdAt: daysAgo(6) },
          { postNumber: postNum(), displayName: dbUsers[0].displayName, authorId: dbUsers[0].id, content: 'ok but the replacement meta is just as broken so what did they even fix', createdAt: daysAgo(6) },
          { postNumber: postNum(), displayName: dbUsers[4].displayName, authorId: dbUsers[4].id, content: 'they never playtest anything, this has been a problem since launch', createdAt: daysAgo(5) },
          { postNumber: postNum(), displayName: 'Anonymous', content: 'just play a different game at this point lol', createdAt: hoursAgo(12) },
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id, content: 'no because i already paid 60 bucks for this', createdAt: hoursAgo(3) },
        ],
      },
    },
  });

  // Thread 2: /x/ — sticky
  const t2 = await prisma.thread.create({
    data: {
      boardId: '/x/', subject: 'READ THIS BEFORE POSTING - board rules', sticky: true, views: 1893, bumpedAt: daysAgo(1),
      createdAt: daysAgo(365),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[7].displayName, authorId: dbUsers[7].id, content: 'This thread is pinned for visibility. Read the rules before posting. Repeat offenders will be banned. - Mod_01', createdAt: daysAgo(365) },
          { postNumber: postNum(), displayName: 'Anonymous', content: 'sticky thread still up after a year lmao', createdAt: daysAgo(1) },
        ],
      },
    },
  });

  // Thread 3: /x/ — active, weird discussion
  const t3 = await prisma.thread.create({
    data: {
      boardId: '/x/', subject: 'does anyone else feel like time moves weird at night', views: 234, bumpedAt: hoursAgo(8),
      createdAt: daysAgo(10),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[3].displayName, authorId: dbUsers[3].id, content: 'every time its past 2am i feel like im in a different version of the day. anyone else get this', createdAt: daysAgo(10) },
          { postNumber: postNum(), displayName: 'Anonymous', content: 'yeah its called being tired and online too much, go to sleep', createdAt: daysAgo(9) },
          { postNumber: postNum(), displayName: dbUsers[2].displayName, authorId: dbUsers[2].id, content: 'this thread again lol. its a known phenomenon, look up "second wind" circadian stuff', createdAt: daysAgo(8) },
          { postNumber: postNum(), displayName: dbUsers[5].displayName, authorId: dbUsers[5].id, content: 'i get this too but only on this site for some reason. something about the colors maybe', createdAt: hoursAgo(8) },
        ],
      },
    },
  });

  // Thread 4: /ph/ — philosophical
  const t4 = await prisma.thread.create({
    data: {
      boardId: '/ph/', subject: 'what if the internet forgets us slower than we forget it', views: 567, bumpedAt: daysAgo(2),
      createdAt: daysAgo(30),
      posts: {
        create: [
          { postNumber: postNum(), displayName: 'Anonymous', content: 'old threads like this just sit here forever while the people who wrote them move on completely', createdAt: daysAgo(30) },
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id, content: 'thats kind of the whole vibe of this site tbh', createdAt: daysAgo(28) },
          { postNumber: postNum(), displayName: dbUsers[5].displayName, authorId: dbUsers[5].id, content: 'i think about this a lot. somewhere there is a forum from 2004 with my posts on it and i will never find it again', createdAt: daysAgo(2) },
        ],
      },
    },
  });

  // Thread 5: /t/ — locked
  const t5 = await prisma.thread.create({
    data: {
      boardId: '/t/', subject: 'locked: read the rules before posting', locked: true, views: 89, bumpedAt: daysAgo(15),
      createdAt: daysAgo(15),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[2].displayName, authorId: dbUsers[2].id, content: 'locking this, duplicate of the pinned thread. use search next time.', createdAt: daysAgo(15) },
        ],
      },
    },
  });

  // Thread 6: /v/ — another active thread
  const t6 = await prisma.thread.create({
    data: {
      boardId: '/v/', subject: 'most underrated game of the 2010s?', views: 156, bumpedAt: hoursAgo(20),
      createdAt: daysAgo(4),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[4].displayName, authorId: dbUsers[4].id, content: 'mine is probably that one niche puzzle game nobody bought but everyone who did loved it', createdAt: daysAgo(4) },
          { postNumber: postNum(), displayName: dbUsers[0].displayName, authorId: dbUsers[0].id, content: 'you are going to say the name right? or are you just going to be mysterious about it', createdAt: daysAgo(3) },
          { postNumber: postNum(), displayName: dbUsers[4].displayName, authorId: dbUsers[4].id, content: 'i genuinely cannot remember the name. this is going to bother me all night now', createdAt: hoursAgo(20) },
        ],
      },
    },
  });

  // Thread 7: /a/ — archived old thread
  const t7 = await prisma.thread.create({
    data: {
      boardId: '/a/', subject: 'what was the best anime of 2012', archived: true, locked: true, views: 2104, bumpedAt: daysAgo(800),
      createdAt: daysAgo(1400),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[5].displayName, authorId: dbUsers[5].id, content: '2012 was stacked. i still think about some of those shows', createdAt: daysAgo(1400) },
          { postNumber: postNum(), displayName: 'Anonymous', content: 'this thread is so old half the shows mentioned probably got sequels by now', createdAt: daysAgo(1200) },
          { postNumber: postNum(), displayName: dbUsers[9].displayName, authorId: dbUsers[9].id, content: 'archived but never forgotten', createdAt: daysAgo(800) },
        ],
      },
    },
  });

  // Thread 8: /p/ — art discussion
  const t8 = await prisma.thread.create({
    data: {
      boardId: '/p/', subject: 'anyone still use traditional media', views: 78, bumpedAt: daysAgo(3),
      createdAt: daysAgo(6),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[6].displayName, authorId: dbUsers[6].id, content: 'everyone went digital but i still prefer the feel of pencil on paper. am i alone here', createdAt: daysAgo(6) },
          { postNumber: postNum(), displayName: 'Anonymous', content: 'no you are not alone, traditional has a warmth that digital cant replicate', createdAt: daysAgo(3) },
        ],
      },
    },
  });

  // Thread 9: /t/ — tech support
  const t9 = await prisma.thread.create({
    data: {
      boardId: '/t/', subject: 'my router keeps dropping connection every 30 min', views: 345, bumpedAt: hoursAgo(15),
      createdAt: daysAgo(2),
      posts: {
        create: [
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id, content: 'it started last week and nothing changed on my end. is it dying or is it the isp', createdAt: daysAgo(2) },
          { postNumber: postNum(), displayName: dbUsers[4].displayName, authorId: dbUsers[4].id, content: 'check the capacitors on the power supply, old routers do this when caps go bad', createdAt: daysAgo(1) },
          { postNumber: postNum(), displayName: dbUsers[1].displayName, authorId: dbUsers[1].id, content: 'its from 2011 so that would track actually. thanks', createdAt: hoursAgo(15) },
        ],
      },
    },
  });

  // Thread 10: /x/ — another old archived thread
  const t10 = await prisma.thread.create({
    data: {
      boardId: '/x/', subject: 'anyone remember the old chatroom from 2010', archived: true, locked: true, views: 892, bumpedAt: daysAgo(1200),
      createdAt: daysAgo(1600),
      posts: {
        create: [
          { postNumber: postNum(), displayName: 'Anonymous', content: 'there used to be a chatroom linked here that was active 24/7. whatever happened to it', createdAt: daysAgo(1600) },
          { postNumber: postNum(), displayName: dbUsers[5].displayName, authorId: dbUsers[5].id, content: 'the server died and nobody rebuilt it. i miss those days', createdAt: daysAgo(1500) },
        ],
      },
    },
  });

  // --- Reports ---
  const t1Posts = await prisma.post.findMany({ where: { threadId: t1.id }, orderBy: { createdAt: 'asc' }, take: 1 });
  const t3Posts = await prisma.post.findMany({ where: { threadId: t3.id }, orderBy: { createdAt: 'asc' }, take: 1 });
  if (t1Posts[0]) {
    await prisma.report.create({
      data: { postId: t1Posts[0].id, reason: 'Spam', details: 'repeated posting', status: 'pending' },
    });
  }
  if (t3Posts[0]) {
    await prisma.report.create({
      data: { postId: t3Posts[0].id, reason: 'Other', details: 'weird vibes', status: 'pending' },
    });
  }

  // --- Warnings ---
  await prisma.warning.create({
    data: { userId: dbUsers[8].id, reason: 'Repeated spam across multiple boards', duration: 'permanent', expiresAt: null, moderatorId: dbUsers[7].id },
  });

  // --- Moderation Actions ---
  await prisma.moderationAction.create({
    data: { moderatorId: dbUsers[7].id, action: 'lock_thread', targetType: 'thread', targetId: String(t5.id), reason: 'Duplicate thread' },
  });
  await prisma.moderationAction.create({
    data: { moderatorId: dbUsers[2].id, action: 'archive_thread', targetType: 'thread', targetId: String(t7.id), reason: 'Old thread, auto-archived' },
  });
  await prisma.moderationAction.create({
    data: { moderatorId: dbUsers[7].id, action: 'ban_user', targetType: 'user', targetId: dbUsers[8].id, reason: 'Spam' },
  });
  await prisma.moderationAction.create({
    data: { moderatorId: dbUsers[2].id, action: 'sticky_thread', targetType: 'thread', targetId: String(t2.id), reason: 'Rules thread' },
  });

  console.log('Seed complete: 6 boards, 10 users, 8 badges, 10 threads, 2 board moderators, 2 reports, 1 warning, 4 moderation actions.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
