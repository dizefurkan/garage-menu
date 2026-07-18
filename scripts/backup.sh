#!/usr/bin/env bash
# One-off Supabase backup: database (pg_dump) + all storage buckets.
# Usage: ./scripts/backup.sh
# Output: backups/<timestamp>/db.sql.gz + backups/<timestamp>/storage/
#
# Reads from .env.local:
#   SUPABASE_DB_URL           Session pooler connection string (Dashboard → Connect)
#   NEXT_PUBLIC_SUPABASE_URL  project URL
#   SUPABASE_SERVICE_ROLE_KEY service role secret
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source .env.local
set +a

PG_DUMP="$(command -v pg_dump || echo /opt/homebrew/opt/libpq/bin/pg_dump)"

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "HATA: .env.local dosyasina SUPABASE_DB_URL ekleyin."
  echo "Supabase Dashboard -> Connect -> Session pooler baglanti dizesini kullanin, ornegin:"
  echo '  SUPABASE_DB_URL="postgresql://postgres.xxxx:SIFRE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"'
  exit 1
fi

STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT="backups/$STAMP"
mkdir -p "$OUT"

echo "==> Veritabani yedekleniyor..."
"$PG_DUMP" "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip > "$OUT/db.sql.gz"
echo "    $OUT/db.sql.gz ($(du -h "$OUT/db.sql.gz" | cut -f1 | tr -d ' '))"

echo "==> Storage bucket'lari yedekleniyor..."
SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" OUT_DIR="$OUT/storage" node scripts/backup-storage.mjs

echo "==> Tamamlandi: $OUT"
