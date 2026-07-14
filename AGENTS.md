# AGENTS.md

## Cursor Cloud specific instructions

Nha Kinhon is a Spanish-language grocery/marketplace app for the Guinea-Bissau diaspora. Two runnable services (no Docker, no monorepo workspaces — two separate npm projects):

- **Backend API** — Express 5 + Prisma + PostgreSQL, in `backend/`. Runs on `http://localhost:3000` (`npm run dev`). Scripts in `backend/package.json`.
- **Web frontend** — React 19 + Vite SPA, repo root. Runs on `http://localhost:5173` (`npm run dev`). Scripts in `package.json`.

A mobile app is only a plan (`PLAN_MOBILE.md`); no code exists.

### Node version
The repo pins Node 20 (`.node-version`). The VM's default `node` on `PATH` (`/exec-daemon/node`) is v22, so Node 20 (via nvm) is prepended to `PATH` in `~/.bashrc`. Login shells (e.g. tmux `bash -l`) get Node 20 automatically; run dev servers/tests from a login shell.

### PostgreSQL (must be running)
PostgreSQL 16 is installed locally and its data dir (migrated + seeded) persists in the VM snapshot. It is **not** auto-started — start it each session with:
`sudo pg_ctlcluster 16 main start`
DB is `nha_kinhon`, credentials `postgres:postgres`. Connection string lives in `backend/.env` (git-ignored, already created):
`postgresql://postgres:postgres@localhost:5432/nha_kinhon`

### Seed gotcha
`backend/prisma/seed.js` does **not** load `.env` (unlike the Prisma CLI migrate commands). Pass the URL explicitly when re-seeding:
`DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nha_kinhon" npm run db:seed`
Seeded logins: `carlos@example.com` / `123456` (USER), `admin@nhakinhon.com` / `admin1234` (ADMIN), `joao@example.com` / `123456` (DELIVERY).

### Optional/unconfigured services (fail soft)
Stripe, Cloudinary, SMTP and Expo push are left unconfigured. The app boots and works; only card payments, image uploads, email and push are unavailable. Product images render as broken placeholders because Cloudinary is unset — this is expected, not a bug.

### Lint/test/build notes
- Tests mock the DB, so Postgres is not needed just to run them: backend `npm test` (vitest), frontend `npm test` (vitest/jsdom).
- Backend `npm run lint` is clean; **frontend `npm run lint` has pre-existing errors** in the repo source (e.g. `no-undef` on `global`), unrelated to environment setup.
- Frontend prod build: `npm run build`.
