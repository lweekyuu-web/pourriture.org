const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function anonId() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function postNum() {
  return 'n.' + (10000000 + Math.floor(Math.random() * 89999999));
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - comment out to preserve)
  // await prisma.post.deleteMany({});
  // await prisma.thread.deleteMany({});
  // await prisma.board.deleteMany({});
  // await prisma.user.deleteMany({});

  // ========== USERS WITH PROFILES ==========
  const users = [];
  const userNames = [
    { displayName: 'HollowFreak', bio: 'still browsing since 2011', signature: 'life is a glitch' },
    { displayName: 'VelociPastor', bio: 'velociraptors and theology', signature: '"In dino we trust"' },
    { displayName: 'NetDiver', bio: 'exploring the deep web', signature: 'stay curious' },
    { displayName: 'PixelMancer', bio: '90s nostalgia enthusiast', signature: 'pixel art or nothing' },
    { displayName: 'SilentWatcher', bio: 'more lurker than poster', signature: 'watching from shadows' },
    { displayName: 'CaffeineMuse', bio: 'late night thoughts only', signature: 'coffee powered brain' },
    { displayName: 'GhostInTheMachine', bio: 'code + philosophy = meaning', signature: '01010011 01001001' },
    { displayName: 'RetroGamer', bio: 'cartridge collector', signature: 'Game Over? Never.' },
  ];

  for (const profile of userNames) {
    const user = await prisma.user.create({
      data: {
        anonId: anonId(),
        displayName: profile.displayName,
        badge: randomChoice(['Newbie', 'Regular', 'Veteran', 'Contributor']),
        createdAt: daysAgo(Math.floor(Math.random() * 1000) + 30),
        postCount: Math.floor(Math.random() * 500) + 5,
        signature: profile.signature,
        bio: profile.bio,
        profileTheme: randomChoice(['default', 'dark', 'retro', 'blue']),
        status: randomChoice(['Regular', 'Veteran', 'Contributor', 'Moderator']),
      },
    });
    users.push(user);
    console.log(`✓ Created user: ${profile.displayName}`);
  }

  // ========== AVATARS (some APPROVED, some PENDING) ==========
  const avatarUrls = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=HollowFreak',
    'https://api.dicebear.com/7.x/bottts/svg?seed=VelociPastor',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelMancer',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=NetDiver',
    'https://api.dicebear.com/7.x/micah/svg?seed=RetroGamer',
  ];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const avatarUrl = avatarUrls[i % avatarUrls.length];

    const avatar = await prisma.avatar.create({
      data: {
        userId: user.id,
        fileName: `${user.displayName.toLowerCase()}_avatar.svg`,
        url: avatarUrl,
        size: Math.floor(Math.random() * 100000) + 10000,
        mimeType: 'image/svg+xml',
        width: 256,
        height: 256,
        status: randomChoice(['APPROVED', 'APPROVED', 'APPROVED', 'PENDING']),
        uploadedAt: daysAgo(Math.floor(Math.random() * 60) + 1),
      },
    });

    // Link avatar to user
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarId: avatar.id },
    });

    console.log(`✓ Created avatar for ${user.displayName} (${avatar.status})`);
  }

  // ========== PROFILE GIFS ==========
  const gifCategories = {
    funny: [
      { id: 'cat_bounce', title: 'Bouncing Cat' },
      { id: 'dog_jump', title: 'Jumping Dog' },
    ],
    reaction: [
      { id: 'thumbs_up', title: 'Thumbs Up' },
      { id: 'facepalm', title: 'Facepalm' },
    ],
    retro: [
      { id: 'matrix_rain', title: 'Matrix Rain' },
      { id: 'scanner', title: 'Scanner Line' },
    ],
  };

  for (let i = 0; i < Math.floor(users.length / 2); i++) {
    const user = users[i];
    const category = Object.keys(gifCategories)[i % Object.keys(gifCategories).length];
    const gif = randomChoice(gifCategories[category]);

    const profileGif = await prisma.profileGif.create({
      data: {
        userId: user.id,
        gifId: gif.id,
        gifUrl: `/gifs/${gif.id}.gif`,
        gifTitle: gif.title,
        category,
        active: true,
        status: 'APPROVED',
        addedAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    });

    // Link to user
    await prisma.user.update({
      where: { id: user.id },
      data: { selectedGifId: profileGif.id },
    });

    console.log(`✓ Added profile GIF to ${user.displayName}: ${gif.title}`);
  }

  // ========== BOARDS ==========
  const boards = [
    { id: '/tech/', name: 'Technology', description: 'Computing, internet, programming' },
    { id: '/random/', name: 'Random', description: 'Off-topic discussions & memes' },
    { id: '/art/', name: 'Art & Design', description: 'Visual creativity & criticism' },
    { id: '/books/', name: 'Books', description: 'Literature discussion' },
    { id: '/games/', name: 'Games', description: 'Retro & modern gaming' },
    { id: '/music/', name: 'Music', description: 'All genres welcome' },
  ];

  for (const board of boards) {
    await prisma.board.upsert({
      where: { id: board.id },
      update: {},
      create: {
        id: board.id,
        name: board.name,
        description: board.description,
        status: 'public',
        rules: `Rules for ${board.name}:\n- Be respectful\n- No spam\n- No commercial solicitation`,
      },
    });
  }
  console.log('✓ Created boards');

  // ========== THREADS & POSTS ==========
  const threadTopics = [
    { subject: 'Best practices for web development in 2026', board: '/tech/' },
    { subject: 'Why Millennium Falcon design is perfect', board: '/random/' },
    { subject: 'Modern artists inspired by old web aesthetics', board: '/art/' },
    { subject: 'Dune book vs. movie adaptations', board: '/books/' },
    { subject: 'Speedrunning Super Metroid - tips?', board: '/games/' },
    { subject: 'Synthwave and retrowave playlists', board: '/music/' },
  ];

  for (const topic of threadTopics) {
    const board = await prisma.board.findUnique({ where: { id: topic.board } });
    const author = randomChoice(users);

    const thread = await prisma.thread.create({
      data: {
        boardId: board.id,
        subject: topic.subject,
        createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
        views: Math.floor(Math.random() * 500),
      },
    });

    // Create OP post
    const opPost = await prisma.post.create({
      data: {
        postNumber: postNum(),
        threadId: thread.id,
        authorId: author.id,
        displayName: author.displayName,
        content: `This is the original post about ${topic.subject.toLowerCase()}. Discussion welcome.`,
        createdAt: thread.createdAt,
        status: 'active',
      },
    });

    // Create 2-5 replies
    const replyCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < replyCount; i++) {
      const responder = randomChoice(users);
      await prisma.post.create({
        data: {
          postNumber: postNum(),
          threadId: thread.id,
          authorId: responder.id,
          displayName: responder.displayName,
          content: `Reply ${i + 1} to the thread. Great discussion!`,
          replyToId: opPost.id,
          createdAt: hoursAgo(Math.floor(Math.random() * 48)),
          status: 'active',
        },
      });
    }

    console.log(`✓ Created thread: ${topic.subject}`);
  }

  // ========== AI MODERATION RESULTS (SAMPLES) ==========
  const user1 = users[0];
  const user1Avatar = await prisma.avatar.findFirst({
    where: { userId: user1.id },
  });

  if (user1Avatar && user1Avatar.status === 'PENDING') {
    const aiResult = await prisma.aIModerationResult.create({
      data: {
        targetType: 'avatar',
        targetId: user1Avatar.id,
        userId: user1.id,
        decision: 'SAFE',
        confidence: 0.92,
        reasons: [],
        flaggedKeywords: [],
        aiModel: 'default-moderation-v1',
      },
    });
    console.log(`✓ Created AI moderation result for avatar`);
  }

  // ========== MODERATION LOGS ==========
  const log1 = await prisma.moderationLog.create({
    data: {
      action: 'AVATAR_APPROVED',
      targetType: 'avatar',
      targetId: users[1].id,
      targetUserId: users[1].id,
      reason: 'Avatar approved via admin review',
      aiDecisionUsed: false,
    },
  });
  console.log('✓ Created moderation log entry');

  // ========== BADGES ==========
  const badges = [
    { name: 'Newbie', color: '#87ceeb', description: 'New member' },
    { name: 'Regular', color: '#4169e1', description: 'Active poster' },
    { name: 'Veteran', color: '#8b0000', description: 'Long-time member' },
    { name: 'OP', color: '#ff6347', description: 'Original Poster' },
    { name: 'Moderator', color: '#ffa500', description: 'Forum moderator' },
    { name: 'Contributor', color: '#32cd32', description: 'Content contributor' },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: {
        name: badge.name,
        color: badge.color,
        description: badge.description,
      },
    });
  }
  console.log('✓ Created badges');

  // ========== SITE SETTINGS ==========
  await prisma.siteSetting.upsert({
    where: { key: 'site_title' },
    update: { value: 'POURRITURE.ORG' },
    create: { key: 'site_title', value: 'POURRITURE.ORG' },
  });

  await prisma.siteSetting.upsert({
    where: { key: 'site_tagline' },
    update: { value: 'ancient forum still online in 2026' },
    create: { key: 'site_tagline', value: 'ancient forum still online in 2026' },
  });

  await prisma.siteSetting.upsert({
    where: { key: 'footer_text' },
    update: { value: 'est. 2006 — still running' },
    create: { key: 'footer_text', value: 'est. 2006 — still running' },
  });

  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
