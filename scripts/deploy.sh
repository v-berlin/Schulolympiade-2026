#!/bin/bash
# Deploy Schulolympiade
# Usage: ./deploy.sh [--build]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "   Copy .env.example to .env and configure your settings:"
    echo "   cp .env.example .env"
    exit 1
fi

# Parse arguments
BUILD=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
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
            echo "Usage: ./deploy.sh [--build] [--down] [--logs] [--status]"
            exit 1
            ;;
    esac
done

echo "🚀 Deploying Schulolympiade..."

# Generate nginx config from template
if [ -f "nginx/conf.d/default.conf.template" ]; then
    echo "📝 Generating nginx config..."
    source .env
    envsubst '${N8N_EMOJI_WEBHOOK_ID}' < nginx/conf.d/default.conf.template > nginx/conf.d/default.conf
fi

if [ "$BUILD" = true ]; then
    echo "🔨 Building images..."
    docker compose build
fi

echo "⬆️ Starting services..."
docker compose up -d

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service URLs (replace \$SERVER_HOST with your IP):"
source .env
echo "   Dashboard:     http://${SERVER_HOST}:${DASHBOARD_PORT:-3000}"
echo "   Edit Results:  http://${SERVER_HOST}:${EDIT_DATA_PORT:-3003}"
echo "   Edit Emojis:   http://${SERVER_HOST}:${EDIT_EMOJI_PORT:-3004}"
echo "   n8n:           http://${SERVER_HOST}:${N8N_PORT:-5678}"
echo "   phpMyAdmin:    http://${SERVER_HOST}:${PHPMYADMIN_PORT:-8080}"
echo "   CloudBeaver:   http://${SERVER_HOST}:${CLOUDBEAVER_PORT:-8081}"
echo ""
echo "📝 Via Nginx (Port ${NGINX_PORT:-80}):"
echo "   Dashboard:     http://${SERVER_HOST}/dashboard"
echo "   Add Result:    http://${SERVER_HOST}/ergebnis"
echo "   Add Emoji:     http://${SERVER_HOST}/emoji"
echo "   Edit Results:  http://${SERVER_HOST}/edit-ergebnis"
echo "   Edit Emojis:   http://${SERVER_HOST}/edit-emoji"
echo ""
echo "📋 Commands:"
echo "   View logs:     ./scripts/deploy.sh --logs"
echo "   Stop:          ./scripts/deploy.sh --down"
echo "   Status:        ./scripts/deploy.sh --status"
