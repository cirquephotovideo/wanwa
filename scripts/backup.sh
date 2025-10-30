#!/bin/bash

# Backup Supabase Database and Storage
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Backup Supabase en cours..."
echo "Destination: $BACKUP_DIR"

# Backup database
echo ""
echo "📊 Backup de la base de données..."
supabase db dump -f "$BACKUP_DIR/database.sql"
echo "✓ Database: $BACKUP_DIR/database.sql"

# Backup storage (if configured)
echo ""
echo "📁 Liste des buckets Storage..."
supabase storage list

# Compress backup
echo ""
echo "🗜️  Compression du backup..."
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"
echo "✓ Backup compressé: $BACKUP_DIR.tar.gz"

# Upload to S3/Cloud (optional)
if [ -n "$S3_BACKUP_BUCKET" ]; then
  echo ""
  echo "☁️  Upload vers S3..."
  aws s3 cp "$BACKUP_DIR.tar.gz" "s3://$S3_BACKUP_BUCKET/wanwa-backups/"
  echo "✓ Backup uploadé vers S3"
fi

echo ""
echo "✓ Backup terminé avec succès!"
echo "Fichier: $BACKUP_DIR.tar.gz"
