#!/usr/bin/env bash
# Backup uploaded media (per-tenant paths under public/uploads)
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/whats-saas/media}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SRC="$APP_DIR/public/uploads"

mkdir -p "$BACKUP_DIR"
if [ -d "$SRC" ]; then
  tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C "$APP_DIR/public" uploads
  echo "Media backup: $BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
else
  echo "No uploads directory at $SRC — skipped"
fi
