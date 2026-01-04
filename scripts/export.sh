#!/bin/bash
# Export Schulolympiade for deployment to another server
# Creates a tarball with all necessary files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${1:-$PROJECT_DIR}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="schulolympiade-deploy-${TIMESTAMP}.tar.gz"

cd "$PROJECT_DIR"

echo "📦 Creating deployment package..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="$TEMP_DIR/schulolympiade"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
echo "   Copying files..."
cp -r services "$DEPLOY_DIR/"
cp -r nginx "$DEPLOY_DIR/"
cp -r mysql-init "$DEPLOY_DIR/"
cp -r n8n-workflows "$DEPLOY_DIR/"
cp -r scripts "$DEPLOY_DIR/"
cp docker-compose.yaml "$DEPLOY_DIR/"
cp .env.example "$DEPLOY_DIR/"
cp README.md "$DEPLOY_DIR/" 2>/dev/null || true

# Create data directories
mkdir -p "$DEPLOY_DIR/data/backups"

# Create archive
echo "   Creating archive..."
cd "$TEMP_DIR"
tar -czf "$OUTPUT_DIR/$ARCHIVE_NAME" schulolympiade

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Deployment package created: $OUTPUT_DIR/$ARCHIVE_NAME"
echo ""
echo "📝 To deploy on a new server:"
echo "   1. Copy $ARCHIVE_NAME to the target server"
echo "   2. Extract: tar -xzf $ARCHIVE_NAME"
echo "   3. cd schulolympiade"
echo "   4. cp .env.example .env"
echo "   5. Edit .env with your settings (IP, passwords, etc.)"
echo "   6. ./scripts/deploy.sh --build"
