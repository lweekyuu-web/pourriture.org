# POURRITURE.ORG — project notes

## What this is
A fictional old-web community forum/imageboard with a deliberately dated 2005–2015 visual language. The production-oriented app supports anonymous identities, customizable pseudonymous profiles, friends, private messages, GIFs, boards, reports, moderation, badges, widgets and an admin area.

## Active application
The deployed Next.js application lives in `pourriture-org-vercel-fixed/`. Vercel should use that directory as its Root Directory.

## Stack
- Next.js 14.2.31 (Pages Router)
- React 18.3.1
- Next.js API routes
- Prisma 5.18
- PostgreSQL

## Important environment variables
- `DATABASE_URL` — runtime PostgreSQL connection string
- `DIRECT_URL` — direct PostgreSQL connection string for Prisma
- `ADMIN_PASSWORD` — master site-admin password; never commit it
- `SESSION_SECRET` — long random secret used for identity/recovery/admin cookies; never commit it
- `GIPHY_API_KEY` — server-side GIPHY API key; never expose it in client code
- `OPENAI_API_KEY` — optional server-side moderation key; never expose it in client code

## Identity and privacy
- `pourriture_uid` identifies a browser identity, not a physical device.
- Recovery keys restore that anonymous identity and must be treated like credentials.
- Login IPs are security data and are restricted to authorized administrator security views.
- Do not expose IP addresses to ordinary users, friends or public profiles.

## Main public pages
- `/` — homepage and public board list
- `/catalog` — board catalog
- `/{board}` — thread list
- `/{board}/thread/{id}` — thread view and replies
- `/search` — search
- `/archive` — archived threads
- `/user/{anonId}` — public pseudonymous profile
- `/profile/edit` — own profile editor
- `/profile/friends` — friend requests, friends and top friends
- `/messages` — private messages
- `/request-board` — board requests
- `/recover` — identity recovery

## Moderation/admin
- `/admin` — master admin dashboard
- `/admin/users` — user, role, badge and delegated-admin settings
- `/admin/badges` — badge definitions
- `/admin/boards` — board management
- `/admin/board-requests` — board request review
- `/admin/moderators` — board moderator assignments
- `/admin/reports` — reports
- `/admin/profile-media` — profile media review
- `/admin/messages` — private-message security/moderation access
- `/admin/security` — login/security information
- `/admin/widgets` — site widgets
- `/admin/settings` — site settings
- `/mod` — moderator workspace

## Moderation behavior
- Normal text posts are published after basic filtering and optional AI moderation.
- AI-flagged posts are held for review.
- If AI moderation is unavailable, GIF posts are held rather than silently published.
- Approved profile media is displayed publicly; pending media is hidden from the public profile.
- Public profile names are pseudonymous display names. `Anonymous` is the default and the Anonymous ID remains the stable identity reference.

## Development
```bash
cd pourriture-org-vercel-fixed
npm install
npm run dev
```

The Prisma schema is in `prisma/schema.prisma`. Use a proper migration workflow for future destructive schema changes; do not put real production secrets in repository files.

## Visual rules
Keep the old-web/imageboard aesthetic coherent:
- Verdana/Arial/Tahoma and small text
- 1px borders, compact spacing and pale blue/gray surfaces
- conventional blue/purple underlined links
- dense post headers with anonymous IDs and post numbers
- minimal animation
- no modern glassmorphism, oversized rounded cards or social-media-style feeds
