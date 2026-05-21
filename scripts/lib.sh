#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

ensure_env_file() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo "❌ Error: .env file not found!"
        echo "   Copy .env.example to .env and configure your settings:"
        echo "   cp .env.example .env"
        return 1
    fi
}

create_env_file() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        echo "✅ .env created from .env.example"
        return 0
    fi
    return 1
}

load_env() {
    ensure_env_file
    local line key value env_file
    env_file="$PROJECT_DIR/.env"

    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        [[ "$line" != *=* ]] && continue

        key="${line%%=*}"
        value="${line#*=}"

        key="${key#"${key%%[![:space:]]*}"}"
        key="${key%"${key##*[![:space:]]}"}"

        if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            continue
        fi

        export "$key=$value"
    done < "$env_file"
}

update_env_value() {
    local key="$1"
    local value="$2"
    local file="$PROJECT_DIR/.env"

    if grep -q "^${key}=" "$file"; then
        sed -i.bak "s|^${key}=.*|${key}=${value}|" "$file"
        rm -f "${file}.bak"
    else
        echo "${key}=${value}" >> "$file"
    fi
}

get_env_value() {
    local key="$1"
    local file="$PROJECT_DIR/.env"
    if [ -f "$file" ]; then
        grep -m1 "^${key}=" "$file" | cut -d= -f2-
    fi
}

generate_hex() {
    local length="${1:-32}"
    python - "$length" <<'PY'
import secrets
import sys

length = int(sys.argv[1])
if length <= 0:
    raise SystemExit("Invalid length")
print(secrets.token_hex(length // 2))
PY
}

generate_uuid() {
    python - <<PY
import uuid
print(uuid.uuid4())
PY
}
