#!/bin/bash
# Import n8n workflow + MySQL credentials based on .env

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

FORCE_IMPORT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_IMPORT=true
            shift
            ;;
        --help)
            echo "Usage: ./scripts/n8n-sync.sh [--force]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_DIR"
load_env

MARKER_FILE="$PROJECT_DIR/.n8n-imported"

if [ -f "$MARKER_FILE" ] && [ "$FORCE_IMPORT" = false ]; then
    echo "ℹ️  n8n configuration already imported. Use --force to re-import."
    exit 0
fi

missing_vars=()
for var in SERVER_HOST SUCCESS_EVENT_PORT N8N_EVENT_WEBHOOK_ID MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE N8N_POSTGRES_USER N8N_POSTGRES_DB N8N_ENCRYPTION_KEY; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required .env values: ${missing_vars[*]}"
    exit 1
fi

MYSQL_HOST_VALUE="${MYSQL_HOST:-mysql}"
MYSQL_PORT_VALUE="${MYSQL_PORT:-3306}"

temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT

template_path="$PROJECT_DIR/n8n-workflows/Add_Event_Schulolympiade_SQL.json"
if [ ! -f "$template_path" ]; then
    echo "❌ Workflow template not found at: $template_path"
    exit 1
fi

workflow_file="$temp_dir/workflow.json"
credentials_file="$temp_dir/credentials.json"

python - "$template_path" "$workflow_file" "$SERVER_HOST" "$SUCCESS_EVENT_PORT" "$N8N_EVENT_WEBHOOK_ID" <<'PY'
import json
import sys

template_path, output_path, server_host, success_port, webhook_id = sys.argv[1:6]
with open(template_path, "r", encoding="utf-8") as handle:
    data = json.load(handle)

redirect_url = f"http://{server_host}:{success_port}"
for node in data.get("nodes", []):
    if "webhookId" in node:
        node["webhookId"] = webhook_id
    parameters = node.get("parameters")
    if isinstance(parameters, dict) and "redirectUrl" in parameters:
        parameters["redirectUrl"] = redirect_url

with open(output_path, "w", encoding="utf-8") as handle:
    json.dump(data, handle, ensure_ascii=False, indent=2)
PY

python - "$credentials_file" "$MYSQL_HOST_VALUE" "$MYSQL_PORT_VALUE" "$MYSQL_USER" "$MYSQL_PASSWORD" "$MYSQL_DATABASE" <<'PY'
import json
import sys

output_path, host, port, user, password, database = sys.argv[1:7]
credentials = [
    {
        "id": "mysql-olympiade",
        "name": "MySQL account",
        "type": "mySql",
        "nodesAccess": [],
        "data": {
            "host": host,
            "user": user,
            "password": password,
            "database": database,
            "port": int(port),
        },
    }
]

with open(output_path, "w", encoding="utf-8") as handle:
    json.dump(credentials, handle, ensure_ascii=False, indent=2)
PY

echo "⏳ Waiting for n8n database..."
attempts=30
until docker compose exec -T postgres pg_isready -U "$N8N_POSTGRES_USER" -d "$N8N_POSTGRES_DB" >/dev/null 2>&1; do
    if [ "$attempts" -le 0 ]; then
        echo "❌ PostgreSQL is not ready for n8n import."
        exit 1
    fi
    attempts=$((attempts - 1))
    sleep 2
done

echo "🔐 Importing MySQL credentials into n8n..."
docker compose run --rm -T -v "$temp_dir:/import:ro" n8n n8n import:credentials --input /import/credentials.json --decrypted

echo "🧩 Importing n8n workflow..."
docker compose run --rm -T -v "$temp_dir:/import:ro" n8n n8n import:workflow --input /import/workflow.json

touch "$MARKER_FILE"
echo "✅ n8n import complete."
