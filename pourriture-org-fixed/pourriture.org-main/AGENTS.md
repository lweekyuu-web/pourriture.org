# Base44 Dev Environment — POURRITURE.ORG

## What this is
A fictional old-web community forum (imageboard aesthetic, ~2009-2015 era). Text-only, anonymous identities, moderation tools. Not a real site — all users/content are fictitious.

## Stack
- **Frontend**: Next.js 14 (pages dir) — React, plain CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL 16 (`postgres:16-alpine`), user/db `pourriture`, password `pourriture_dev`
- **ORM**: Prisma 5.18 — schema at `pourture-org-v3/prisma/schema.prisma` (provider: `postgresql`)
- **Seed**: `pourture-org-v3/prisma/seed.js` — creates 6 boards, 10 users, 8 badges, 10 threads (incl. sticky/locked/archived), 2 board moderators, 2 reports, 1 warning, 4 moderation actions

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
- App on http://localhost:3000
- Source lives in `pourture-org-v3/` (not repo root)
- Source is bind-mounted (`./pourture-org-v3:/app`) so edits hot-reload
- Setup service runs migrations + seed automatically on first boot

## Reset database
```bash
docker compose -f docker-compose.base44.yml down -v
docker compose -f docker-compose.base44.yml up -d
```

## Key pages
- `/` — Homepage with board list
- `/catalog` — Board catalog (table view)
- `/{board}` — Board thread listing (sticky first, bump ordering)
- `/{board}/thread/{id}` — Thread view (OP badge, views, replies)
- `/search` — Search posts/threads/users
- `/archive` — Archived threads (read-only)
- `/user/{anonId}` — User profile
- `/faq`, `/rules`, `/contact`, `/privacy`, `/status` — Info pages
- `/admin` — Admin dashboard (password-protected)
- `/admin/boards` — Board CRUD + rules editing
- `/admin/badges` — Badge management
- `/admin/moderators` — Board moderator assignment
- `/admin/users` — User management (role, ban)
- `/admin/reports` — Report queue
- `/mod` — Moderator space (mods + admins)
- `/mod/reports`, `/mod/posts`, `/mod/threads`, `/mod/users`, `/mod/log`, `/mod/warnings`

## Auth model
- Anonymous identity auto-generated via cookie (`pourriture_uid`)
- Admin auth via password cookie (`pourriture_admin`)
- Admin password: `ADMIN_PASSWORD` env var
- Board moderators: assigned per-board with specific permissions

## Env vars
- `DATABASE_URL` / `DIRECT_URL` — set in compose
- `ADMIN_PASSWORD` — admin login password (in .env.base44-defaults or /run/base44/app.env)
- `SESSION_SECRET` — cookie signing (in .env.base44-defaults or /run/base44/app.env)

## Schema models
User, Board, Thread (sticky/archived/views/bumpedAt), Post (status), Report (status), Warning, BoardModerator (permissions), Badge, ModerationAction (moderatorId), Widget, SiteSetting
