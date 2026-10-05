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

### Live order tracking (`GET /api/orders/:id/tracking`, admin mirror)
Tracking payload includes: `courierSignalState` (`LIVE` | `STALE` | `NO_GPS`, null before pickup/transit), `isLive`, `courierLocationStale`, `lastLocationAt`, `lastLocationAgeSeconds`, `routePolyline` (OSRM driving route when available), `routeDistanceMeters`, `etaSeconds`, `etaLabel`. GPS is **live** only when order status is `PICKED_UP` or `IN_TRANSIT` and `updatedAt` is ≤ `LIVE_LOCATION_MAX_AGE_MS` (2 min). Stale GPS must be shown as frozen (no implied movement). Optional env `OSRM_URL` (default public OSRM). Web compact map before pickup: `CONFIRMED` / `PROCESSING` / `SHIPPED`.

**Low bandwidth (mobile):** see [`docs/TRACKING_OFFLINE.md`](docs/TRACKING_OFFLINE.md). Lean tracking via `?fields=lean` or `GET .../tracking/lean`. JSON responses use gzip + brotli (`Accept-Encoding`). Courier GPS batch upload: `PUT /api/delivery/location` with `{ points: [...] }`. Recommended poll: 5–10 s (good network), 20–30 s (2G). Order list endpoint omits `deliveryPhotos` (detail endpoints unchanged).

### Push notifications (delivery journey)
Buyer push uses Expo (`POST /api/notifications/push-token`). Delivery events reuse `createNotification` (in-app + push). Order-related notifications persist nullable `orderId` on the `Notification` row. `GET /api/notifications` returns the same deep-link hints as push `data`: `orderId`, `screen: "order_tracking"`, mobile `route: /pedido/:id`, web `url: /perfil?tab=orders&orderId=:id` (inbox-only notifs use `route`/`url` `/notificaciones`). Courier-nearby alerts fire once per order when GPS updates put the repartidor within 500 m of `recipientLat/Lng` (requires coordinates on the order). No extra env vars beyond a running backend with network egress to `exp.host`.

### Lint/test/build notes
- Tests mock the DB, so Postgres is not needed just to run them: backend `npm test` (vitest), frontend `npm test` (vitest/jsdom).
- Backend `npm run lint` is clean; **frontend `npm run lint` has pre-existing errors** in the repo source (e.g. `no-undef` on `global`), unrelated to environment setup.
- Frontend prod build: `npm run build`.
