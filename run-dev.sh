#!/usr/bin/env bash
# ==============================================================================
# NEIMAN Development Runner — Live Live-Reload Desktop & Full-Stack Environment
# ==============================================================================
# Starts or ensures the FastAPI backend is running, applies database schema,
# and launches live Tauri development with hot-reloading: npm run tauri:dev
# ==============================================================================

set -euo pipefail

TARGET="${BASH_SOURCE[0]}"
while [ -h "$TARGET" ]; do
    DIR="$(cd -P "$(dirname "$TARGET")" && pwd)"
    TARGET="$(readlink "$TARGET")"
    [[ $TARGET != /* ]] && TARGET="$DIR/$TARGET"
done
ROOT_DIR="$(cd -P "$(dirname "$TARGET")" && pwd)"
API_DIR="${ROOT_DIR}/apps/api"
WEB_DIR="${ROOT_DIR}/apps/web"

API_PORT="${API_PORT:-8000}"
API_URL="http://127.0.0.1:${API_PORT}"

# Real-life operational persistent storage
DATA_DIR="${HOME}/.local/share/neiman"
mkdir -p "${DATA_DIR}"
DB_FILE="${DATA_DIR}/production.db"
export DATABASE_URL="sqlite+aiosqlite:///${DB_FILE}"
export DISABLE_AUTH="true"
export ENVIRONMENT="development"
export WEBKIT_DISABLE_COMPOSITING_MODE=1

echo "========================================================================"
echo "  NEIMAN OS — Live Desktop Development Environment"
echo "  Database: ${DB_FILE}"
echo "  Backend:  ${API_URL}"
echo "========================================================================"

# ------------------------------------------------------------------------------
# 1. Ensure Backend Dependencies & Active API Service
# ------------------------------------------------------------------------------
API_PID=""
cleanup() {
    if [ -n "${API_PID}" ]; then
        echo ""
        echo "[*] Shutting down spawned API backend (PID ${API_PID})..."
        kill -TERM "${API_PID}" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

if curl -s --connect-timeout 1 "${API_URL}/api/v1/companies/me" >/dev/null 2>&1; then
    echo "[✓] FastAPI backend already active on port ${API_PORT}."
else
    echo "[*] Starting FastAPI backend on port ${API_PORT}..."
    cd "${API_DIR}"
    
    # Run uvicorn in background using local virtualenv
    .venv/bin/python -m uvicorn nexora.main:app \
        --host 127.0.0.1 \
        --port "${API_PORT}" \
        --reload &
    API_PID=$!

    echo -n "[*] Waiting for backend readiness..."
    READY=false
    for i in {1..30}; do
        if curl -s --connect-timeout 1 "${API_URL}/api/v1/companies/me" >/dev/null 2>&1; then
            READY=true
            echo " ready!"
            break
        fi
        sleep 0.5
        echo -n "."
    done

    if [ "${READY}" != "true" ]; then
        echo ""
        echo "[!] Warning: Backend readiness probe timed out; proceeding to launch desktop."
    fi
fi

# ------------------------------------------------------------------------------
# 2. Launch Live Tauri Desktop Environment
# ------------------------------------------------------------------------------
echo "[*] Launching Tauri Desktop in hot-reload development mode (npm run tauri:dev)..."
cd "${WEB_DIR}"
npm run tauri:dev
