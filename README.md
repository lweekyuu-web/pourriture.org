# POURRITURE.ORG

Fictional old-web community forum/imageboard project. The active Next.js application is in `pourriture-org-vercel-fixed/`.

## Active stack
- Next.js 14.2.31 + React 18.3.1
- Prisma 5.18
- PostgreSQL
- Vercel-compatible deployment

## Vercel
Set the project's **Root Directory** to:

```text
pourriture-org-vercel-fixed
```

Required environment variables:

```text
DATABASE_URL=...
DIRECT_URL=...
ADMIN_PASSWORD=...
SESSION_SECRET=...
```

Optional integrations:

```text
GIPHY_API_KEY=...
OPENAI_API_KEY=...
```

Never commit real secrets or recovery keys.

## Features

The active application includes:

- anonymous browser identities with recovery keys
- pseudonymous profiles with chosen display names, avatars, banners, GIFs and personal styling
- MySpace-style friends, requests and top friends
- private user-to-user messages
- GIF search through a server-side provider integration
- boards, threads, replies, quotes, sticky/locked/archived threads
- reports and moderation queues
- profile-media moderation
- badges and staff roles
- board moderators with board-specific permissions
- admin user management and delegated-admin settings
- security view for recent login IP information, restricted to authorized administrators
- configurable widgets and site settings

## Privacy model
`Anonymous` is the default public name. A user can choose a pseudonymous display name; the stable Anonymous ID remains the identity reference. IP addresses are security information and are not shown to ordinary users or friends.

The private-message admin view is intended for security/moderation purposes and should remain tightly restricted.

## Local development

```bash
cd pourriture-org-vercel-fixed
npm install
npm run dev
```

The Prisma schema is at `pourriture-org-vercel-fixed/prisma/schema.prisma`.

## Style

The site intentionally resembles an older forum/imageboard rather than a modern social network: compact typography, 1px borders, pale blue/gray surfaces, blue/purple links, dense post headers and restrained UI.

For the detailed project notes, see `pourriture-org-vercel-fixed/AGENTS.md`.
