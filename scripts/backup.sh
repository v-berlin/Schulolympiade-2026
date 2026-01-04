#!/bin/bash
# Backup MySQL database manually
# Usage: ./backup.sh [output_dir]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${1:-$PROJECT_DIR/data/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

source .env

mkdir -p "$OUTPUT_DIR"

BACKUP_FILE="$OUTPUT_DIR/schulolympiade_${TIMESTAMP}.sql.gz"

echo "💾 Creating database backup..."
docker exec schulolympiade_mysql mysqldump \
    -u"$MYSQL_USER" \
    -p"$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE" | gzip > "$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_FILE"
