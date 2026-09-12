# Base44 Dev Environment — POURRITURE.ORG

## Project
Next.js 14 (pages router) + Prisma + PostgreSQL imageboard/forum prototype.
Source lives in `pourture-org-v3/` (not repo root).

## Stack & Setup
- **Runtime**: Node 22 (`node:22` base image), Next.js 14.2.5 dev server
- **Database**: PostgreSQL 16 (`postgres:16-alpine`), user/db `pourriture`, password `pourriture_dev`
- **ORM**: Prisma 5.18 — schema at `pourture-org-v3/prisma/schema.prisma` (provider: `postgresql`)
- **Seed**: `pourture-org-v3/prisma/seed.js` — creates 6 boards, demo users, threads, posts

## Docker Compose (`docker-compose.base44.yml`)
Three services:
1. `db` — PostgreSQL with healthcheck
2. `setup` — one-shot: `npm install` → `prisma generate` → `prisma db push` → `seed.js`, then exits
3. `app` — `next dev -H 0.0.0.0` on port 3000, depends on `setup` completing successfully

Source is bind-mounted (`./pourture-org-v3:/app`) so edits hot-reload.

## Environment Variables
- `DATABASE_URL` / `DIRECT_URL` — set inline in compose (local PostgreSQL, not a secret)
- `ADMIN_PASSWORD` — admin login password; generated dev placeholder in `/run/base44/app.env`
- `SESSION_SECRET` — signs the admin session cookie; generated dev placeholder in `/run/base44/app.env`
- `env_file` ordering: `.env.base44-defaults` (placeholders) → `/run/base44/app.env` (real values, always wins)

## Verification
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- Homepage shows 6 boards (/a/, /p/, /ph/, /t/, /v/, /x/) with thread counts
- Admin at `/admin/login` (password = `ADMIN_PASSWORD` env var)

## Notes
- Next.js 14 does NOT support `allowedDevOrigins` in next.config.js (causes a warning). The dev server doesn't restrict origins in v14, so the preview works without it.
- The seed script is NOT idempotent for threads/posts (uses `create`, not `upsert`). Re-running `setup` creates duplicates. To reset: `docker compose -f docker-compose.base44.yml down -v && up -d`.
- Prisma schema uses both `url` (DATABASE_URL) and `directUrl` (DIRECT_URL) — both must point to the same PostgreSQL instance.
