#!/usr/bin/env bash
# Daily PostgreSQL backup — tenant-safe logical dump
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/whats-saas/postgres}"
# Retention: 7 daily (default), configure weekly/monthly archive separately
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

: "${POSTGRES_URL:?POSTGRES_URL required}"

FILE="$BACKUP_DIR/whats_saas_${TIMESTAMP}.sql.gz"
pg_dump "$POSTGRES_URL" --no-owner --format=plain | gzip -9 > "$FILE"
echo "Backup written: $FILE"

find "$BACKUP_DIR" -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "Pruned backups older than ${RETENTION_DAYS} days"
