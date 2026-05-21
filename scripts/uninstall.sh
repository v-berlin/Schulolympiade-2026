#!/bin/bash
# Stop services and optionally remove volumes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

PURGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --purge)
            PURGE=true
            shift
            ;;
        --help)
            echo "Usage: ./scripts/uninstall.sh [--purge]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_DIR"

if [ "$PURGE" = true ]; then
    echo "⚠️  Entferne Container, Volumes und gespeicherte Daten..."
    docker compose down -v --remove-orphans
    rm -f "$PROJECT_DIR/.n8n-imported"
    echo "✅ Alles entfernt."
else
    echo "🛑 Stoppe alle Container..."
    docker compose down --remove-orphans
    echo "✅ Container gestoppt."
fi
