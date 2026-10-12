#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/nha_kinhon}"

echo "Applying migrations to ${DATABASE_URL}"
cd "$ROOT"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
DATABASE_URL="$DATABASE_URL" npx prisma generate

echo "Re-seeding (optional)"
DATABASE_URL="$DATABASE_URL" npm run db:seed

echo "Migration verify OK"
