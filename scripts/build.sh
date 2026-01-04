#!/bin/bash
# Build all Docker images for Schulolympiade
# Usage: ./build.sh [--push] [--registry REGISTRY]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
REGISTRY=""
PUSH=false
TAG="latest"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH=true
            shift
            ;;
        --registry)
            REGISTRY="$2/"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_DIR"

echo "🔨 Building Schulolympiade Docker images..."
echo "   Registry: ${REGISTRY:-local}"
echo "   Tag: $TAG"
echo ""

# Services to build
SERVICES=(
    "dashboard"
    "edit-data"
    "success-event"
    "ip-logging"
)

for SERVICE in "${SERVICES[@]}"; do
    IMAGE_NAME="${REGISTRY}schulolympiade-${SERVICE}:${TAG}"
    echo "📦 Building $SERVICE -> $IMAGE_NAME"
    docker build -t "$IMAGE_NAME" -f "services/${SERVICE}/Dockerfile" .
    
    if [ "$PUSH" = true ]; then
        echo "   Pushing $IMAGE_NAME..."
        docker push "$IMAGE_NAME"
    fi
    echo ""
done

echo "✅ All images built successfully!"

if [ "$PUSH" = true ]; then
    echo "✅ All images pushed to ${REGISTRY:-local registry}"
fi

echo ""
echo "📝 To deploy, copy .env.example to .env and run:"
echo "   docker compose up -d"
