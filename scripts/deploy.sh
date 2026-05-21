#!/bin/bash
# Deploy Schulolympiade
# Usage: ./deploy.sh [--build]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

cd "$PROJECT_DIR"

# Parse arguments
BUILD=false
IMPORT_N8N=false
FORCE_N8N=false
while [[ $# -gt 0 ]]; do
    case $1 in
       --build)
           BUILD=true
           shift
           ;;
       --import-n8n)
           IMPORT_N8N=true
           shift
           ;;
       --force-n8n)
           IMPORT_N8N=true
           FORCE_N8N=true
           shift
           ;;
       --down)
           echo "🛑 Stopping all services..."
           docker compose down
           exit 0
           ;;
       --logs)
           docker compose logs -f
           exit 0
           ;;
       --status)
           docker compose ps
           exit 0
           ;;
       *)
           echo "Unknown option: $1"
           echo "Usage: ./deploy.sh [--build] [--import-n8n] [--force-n8n] [--down] [--logs] [--status]"
           exit 1
           ;;
    esac
done

ensure_env_file

echo "🚀 Deploying Schulolympiade..."

if [ "$BUILD" = true ]; then
    echo "🔨 Building images..."
    docker compose build
fi

echo "⬆️ Starting services..."
docker compose up -d

if [ "$IMPORT_N8N" = true ] || [ ! -f "$PROJECT_DIR/.n8n-imported" ]; then
    if [ "$FORCE_N8N" = true ]; then
        "$SCRIPT_DIR/n8n-sync.sh" --force
    else
        "$SCRIPT_DIR/n8n-sync.sh"
    fi
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service URLs (replace \$SERVER_HOST with your IP):"
load_env
echo "   Dashboard:     http://${SERVER_HOST}:${DASHBOARD_PORT:-3000}"
echo "   Edit Results:  http://${SERVER_HOST}:${EDIT_DATA_PORT:-3003}"
echo "   n8n:           http://${SERVER_HOST}:${N8N_PORT:-5678}"
echo "   phpMyAdmin:    http://${SERVER_HOST}:${PHPMYADMIN_PORT:-8080}"
echo "   CloudBeaver:   http://${SERVER_HOST}:${CLOUDBEAVER_PORT:-8081}"
echo ""
echo "📝 Via Nginx (Port ${NGINX_PORT:-80}):"
echo "   Dashboard:     http://${SERVER_HOST}/dashboard"
echo "   Add Result:    http://${SERVER_HOST}/ergebnis"
echo "   Edit Results:  http://${SERVER_HOST}/edit-ergebnis"
echo ""
echo "📋 Commands:"
echo "   View logs:     ./scripts/deploy.sh --logs"
echo "   Stop:          ./scripts/deploy.sh --down"
echo "   Status:        ./scripts/deploy.sh --status"
echo "   n8n import:    ./scripts/n8n-sync.sh --force"
