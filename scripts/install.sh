#!/bin/bash
# Install & start all services with auto n8n import

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

BUILD_IMAGES=false
SKIP_N8N=false
FORCE_N8N=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_IMAGES=true
            shift
            ;;
        --skip-n8n)
            SKIP_N8N=true
            shift
            ;;
        --force-n8n)
            FORCE_N8N=true
            shift
            ;;
        --help)
            echo "Usage: ./scripts/install.sh [--build] [--skip-n8n] [--force-n8n]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_DIR"

created_env=false
if create_env_file; then
    created_env=true
    update_env_value "MYSQL_ROOT_PASSWORD" "$(generate_hex 32)"
    update_env_value "MYSQL_PASSWORD" "$(generate_hex 32)"
    update_env_value "ADMIN_PASSWORD" "$(generate_hex 24)"
    update_env_value "N8N_POSTGRES_PASSWORD" "$(generate_hex 32)"
    update_env_value "N8N_BASIC_AUTH_PASSWORD" "$(generate_hex 24)"
    update_env_value "N8N_ENCRYPTION_KEY" "$(generate_hex 32)"
    update_env_value "N8N_EVENT_WEBHOOK_ID" "$(generate_uuid)"
fi

if [ -z "$(get_env_value N8N_ENCRYPTION_KEY)" ]; then
    update_env_value "N8N_ENCRYPTION_KEY" "$(generate_hex 32)"
fi

if [ -z "$(get_env_value N8N_EVENT_WEBHOOK_ID)" ]; then
    update_env_value "N8N_EVENT_WEBHOOK_ID" "$(generate_uuid)"
fi

if [ -z "$(get_env_value MYSQL_HOST)" ]; then
    update_env_value "MYSQL_HOST" "mysql"
fi

if [ "$created_env" = true ]; then
    echo "⚠️  Bitte .env prüfen (SERVER_HOST, Ports, Nutzer) bevor produktiv genutzt wird."
fi

deploy_args=()
if [ "$BUILD_IMAGES" = true ]; then
    deploy_args+=(--build)
fi

if [ "$SKIP_N8N" = false ]; then
    deploy_args+=(--import-n8n)
fi

if [ "$FORCE_N8N" = true ]; then
    deploy_args+=(--force-n8n)
fi

"$SCRIPT_DIR/deploy.sh" "${deploy_args[@]}"
