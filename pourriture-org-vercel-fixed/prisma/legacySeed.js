// Fictional historical data for the site's retro atmosphere.
// This is intentionally labeled as fictional: these users/posts are not real people or recovered records.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const d = (year, month, day, hour = 12, minute = 0) => new Date(Date.UTC(year, month - 1, day, hour, minute));

async function main() {
  const boards = [
    { id: '/x/', name: 'Random', description: 'The old general board. Anything that does not fit somewhere else.', rules: 'No spam\nNo real personal information\nNo threats\nKeep it readable', createdAt: d(2009, 3, 14), featured: true },
    { id: '/v/', name: 'Video Games', description: 'Games, consoles, old releases, new releases, and arguments that never end.', rules: 'No piracy links\nUse spoiler warnings\nStay on topic', createdAt: d(2009, 4, 2) },
    { id: '/a/', name: 'Anime & Manga', description: 'Anime, manga, fan art, openings, endings and old favorites.', rules: 'Spoilers marked\nNo explicit material\nBe respectful', createdAt: d(2009, 6, 28) },
    { id: '/t/', name: 'Technology', description: 'Hardware, software, computers and internet archaeology.', rules: 'No malware\nSearch before asking\nNo personal data', createdAt: d(2010, 1, 17) },
    { id: '/p/', name: 'Art', description: 'Drawings, sketches, scans and creative experiments.', rules: 'Constructive criticism\nCredit other artists\nNo spam', createdAt: d(2010, 8, 9) },
    { id: '/ph/', name: 'Philosophy', description: 'Late-night questions, arguments and unfinished theories.', rules: 'Argue ideas, not people\nNo harassment', createdAt: d(2011, 11, 3) },
    { id: '/old/', name: 'Old Internet', description: 'Websites, software, forums and memories from the older web.', rules: 'Archive links when possible\nKeep discussions on topic', createdAt: d(2012, 2, 19) },
  ];

  for (const board of boards) {
    await prisma.board.upsert({
      where: { id: board.id },
      update: { name: board.name, description: board.description, rules: board.rules, featured: board.featured || false },
      create: board,
    });
  }

  const users = [
    { anonId: 'A17C9E', displayName: 'HollowFreak', badge: 'Veteran', status: 'Veteran', postCount: 483, createdAt: d(2009, 4, 7) },
    { anonId: '04B7D2', displayName: 'nullpointer', badge: 'Veteran', status: 'Veteran', postCount: 156, createdAt: d(2010, 2, 12) },
    { anonId: '9F31AA', displayName: 'RustyBlade', badge: 'Veteran', status: 'Veteran', postCount: 892, createdAt: d(2009, 8, 21) },
    { anonId: 'C81E40', displayName: 'sleepy_void', badge: 'Trusted', status: 'Regular', postCount: 1502, createdAt: d(2011, 1, 4) },
    { anonId: 'B00B13', displayName: 'YanderDev', badge: 'Moderator', role: 'moderator', status: 'Moderator', postCount: 1247, createdAt: d(2012, 6, 18) },
    { anonId: '7D4E91', displayName: 'cryptid_42', badge: 'Regular', status: 'Regular', postCount: 67, createdAt: d(2016, 9, 2) },
    { anonId: 'DEAD00', displayName: 'Deleted user', badge: 'Newbie', status: 'Deleted', banned: true, postCount: 23, createdAt: d(2010, 5, 11) },
  ];

  const dbUsers = {};
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { anonId: user.anonId } });
    if (existing) {
      dbUsers[user.anonId] = existing;
    } else {
      dbUsers[user.anonId] = await prisma.user.create({ data: user });
    }
  }

  const threads = [
    { boardId: '/old/', subject: 'remember when websites had guestbooks', createdAt: d(2009, 5, 23), bumpedAt: d(2010, 1, 2), views: 2189, archived: true, locked: true, posts: [
      ['A17C9E', 'I miss when every personal website had a guestbook and a tiny counter.', d(2009, 5, 23)],
      ['9F31AA', 'and a "best viewed at 800x600" badge somewhere near the bottom', d(2009, 5, 24)],
      ['C81E40', 'found this thread again six months later. the site is still here lol', d(2010, 1, 2)],
    ] },
    { boardId: '/x/', subject: 'this place has been here forever', createdAt: d(2012, 7, 18), bumpedAt: d(2017, 10, 4), views: 9431, archived: true, locked: true, posts: [
      ['04B7D2', 'does anyone know when /x/ was actually created?', d(2012, 7, 18)],
      ['B00B13', 'before I was a mod. the oldest database note says 2009.', d(2012, 7, 19)],
      ['A17C9E', 'still checking this place in 2017. nothing ever really changes.', d(2017, 10, 4)],
    ] },
    { boardId: '/t/', subject: 'old computers thread', createdAt: d(2014, 2, 8), bumpedAt: d(2016, 11, 12), views: 1722, archived: true, locked: true, posts: [
      ['04B7D2', 'my first PC had a beige case and a noisy hard drive.', d(2014, 2, 8)],
      ['7D4E91', 'I found an old machine in my parents attic and it still boots.', d(2016, 11, 12)],
    ] },
  ];

  for (const thread of threads) {
    const exists = await prisma.thread.findFirst({ where: { boardId: thread.boardId, subject: thread.subject } });
    if (exists) continue;
    await prisma.thread.create({
      data: {
        boardId: thread.boardId, subject: thread.subject, createdAt: thread.createdAt, bumpedAt: thread.bumpedAt,
        views: thread.views, archived: thread.archived, locked: thread.locked,
        posts: { create: thread.posts.map(([anonId, content, createdAt]) => ({ postNumber: `n.${Math.floor(10000000 + Math.random() * 89999999)}`, authorId: dbUsers[anonId]?.id || null, displayName: dbUsers[anonId]?.displayName || 'Anonymous', content, createdAt })) },
      },
    });
  }

  console.log('Fictional legacy boards/users/threads installed.');
}

main().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
