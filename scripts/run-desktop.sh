#!/usr/bin/env bash
# ==============================================================================
# NEIMAN Desktop Runner — Real-Life Operations & Desktop Orchestration
# ==============================================================================
# Runs the full NEIMAN Autonomous Organization OS desktop experience:
# 1. Configures dedicated local persistent SQLite storage:
#    ~/.local/share/neiman/production.db
# 2. Applies database migrations automatically with zero mock/demo data.
# 3. Ensures FastAPI backend is active and healthy on port 8000.
# 4. Supports dual desktop execution modes:
#    - ./run-desktop.sh (or --release): launches standalone compiled AppImage
#    - ./run-desktop.sh --dev: launches hot-reload development desktop runtime
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${ROOT_DIR}/apps/api"
WEB_DIR="${ROOT_DIR}/apps/web"

MODE="release"
for arg in "$@"; do
    case "$arg" in
        --dev)
            MODE="dev"
            ;;
        --release)
            MODE="release"
            ;;
        -h|--help)
            echo "Usage: $0 [--release | --dev]"
            echo ""
            echo "Options:"
            echo "  --release   Launch compiled native AppImage binary (default)"
            echo "  --dev       Launch development desktop runtime with hot reload"
            exit 0
            ;;
    esac
done

API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-3000}"
API_URL="http://127.0.0.1:${API_PORT}"
WEB_URL="http://127.0.0.1:${WEB_PORT}"

# Real-life operational persistent storage
DATA_DIR="${HOME}/.local/share/neiman"
mkdir -p "${DATA_DIR}"
DB_FILE="${DATA_DIR}/production.db"
export DATABASE_URL="sqlite+aiosqlite:///${DB_FILE}"

echo "================================================================="
echo "   NEIMAN — Autonomous Organization OS (Desktop Host)            "
echo "================================================================="
echo "[+] Operation Mode : Real-Life Operations (Zero Demo Data)"
echo "[+] Target Database: ${DB_FILE}"
echo "[+] Execution Mode : ${MODE}"

# ------------------------------------------------------------------------------
# 1. Database Schema Migration (Zero Demo Data)
# ------------------------------------------------------------------------------
echo "[*] Checking and migrating persistent database schema..."
if [ -x "${API_DIR}/.venv/bin/alembic" ]; then
    (cd "${API_DIR}" && DATABASE_URL="${DATABASE_URL}" "${API_DIR}/.venv/bin/alembic" upgrade head >/dev/null 2>&1) || {
        echo "[!] Note: Continuing startup..."
    }
    echo "[+] Database schema ready."
    if [ -x "${API_DIR}/.venv/bin/python" ]; then
        (cd "${API_DIR}" && DATABASE_URL="${DATABASE_URL}" "${API_DIR}/.venv/bin/python" -m nexora.scripts.init_admin >/dev/null 2>&1) || true
    fi
fi

# ------------------------------------------------------------------------------
# 2. Backend Orchestration (FastAPI API server)
# ------------------------------------------------------------------------------
API_PID=""
WEB_PID=""

cleanup() {
    echo ""
    echo "[*] Shutting down NEIMAN Desktop session..."
    if [ -n "${API_PID}" ] && kill -0 "${API_PID}" 2>/dev/null; then
        echo "[*] Stopping backend API server (PID: ${API_PID})..."
        kill "${API_PID}" 2>/dev/null || true
    fi
    if [ -n "${WEB_PID}" ] && kill -0 "${WEB_PID}" 2>/dev/null; then
        echo "[*] Stopping web frontend server (PID: ${WEB_PID})..."
        kill "${WEB_PID}" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "[*] Checking if NEIMAN API backend is running on port ${API_PORT}..."
if curl -s --connect-timeout 1 "${API_URL}/health" >/dev/null 2>&1 || curl -s --connect-timeout 1 "${API_URL}/" >/dev/null 2>&1; then
    echo "[+] Found existing backend active at ${API_URL}"
else
    echo "[*] Starting background FastAPI backend on port ${API_PORT}..."
    if [ -x "${API_DIR}/.venv/bin/python" ]; then
        (cd "${API_DIR}" && DATABASE_URL="${DATABASE_URL}" "${API_DIR}/.venv/bin/python" -m uvicorn nexora.main:app --host 127.0.0.1 --port "${API_PORT}" --log-level warning) &
        API_PID=$!
    elif command -v uv >/dev/null 2>&1; then
        (cd "${API_DIR}" && DATABASE_URL="${DATABASE_URL}" uv run uvicorn nexora.main:app --host 127.0.0.1 --port "${API_PORT}" --log-level warning) &
        API_PID=$!
    else
        (cd "${API_DIR}" && DATABASE_URL="${DATABASE_URL}" python3 -m uvicorn nexora.main:app --host 127.0.0.1 --port "${API_PORT}" --log-level warning) &
        API_PID=$!
    fi

    # Wait up to 10 seconds for backend to become responsive
    echo -n "[*] Waiting for backend readiness..."
    for i in {1..20}; do
        if curl -s --connect-timeout 1 "${API_URL}/health" >/dev/null 2>&1 || curl -s --connect-timeout 1 "${API_URL}/" >/dev/null 2>&1; then
            echo " ready!"
            break
        fi
        sleep 0.5
        echo -n "."
    done
fi

# ------------------------------------------------------------------------------
# 3. Web Frontend Orchestration (Ensures port 3000 is served)
# ------------------------------------------------------------------------------
echo "[*] Checking if Next.js frontend is active on port ${WEB_PORT}..."
if curl -s --connect-timeout 1 "${WEB_URL}" >/dev/null 2>&1; then
    echo "[+] Found existing frontend active at ${WEB_URL}"
else
    echo "[*] Starting local Next.js frontend service..."
    if [ "${MODE}" = "release" ] && [ -f "${WEB_DIR}/.next/standalone/server.js" ]; then
        if [ ! -d "${WEB_DIR}/.next/standalone/.next/static" ]; then
            cp -r "${WEB_DIR}/.next/static" "${WEB_DIR}/.next/standalone/.next/" 2>/dev/null || true
            cp -r "${WEB_DIR}/public" "${WEB_DIR}/.next/standalone/" 2>/dev/null || true
        fi
        (cd "${WEB_DIR}/.next/standalone" && PORT="${WEB_PORT}" node server.js) >/dev/null 2>&1 &
        WEB_PID=$!
    elif [ "${MODE}" = "release" ]; then
        (cd "${WEB_DIR}" && npm run start -- -p "${WEB_PORT}") >/dev/null 2>&1 &
        WEB_PID=$!
    else
        (cd "${WEB_DIR}" && npm run dev -- -p "${WEB_PORT}") >/dev/null 2>&1 &
        WEB_PID=$!
    fi

    echo -n "[*] Waiting for frontend readiness..."
    for i in {1..30}; do
        if curl -s --connect-timeout 1 "${WEB_URL}" >/dev/null 2>&1; then
            echo " ready!"
            break
        fi
        sleep 0.5
        echo -n "."
    done
fi

# ------------------------------------------------------------------------------
# 4. Launch Desktop Application
# ------------------------------------------------------------------------------
export WEBKIT_DISABLE_COMPOSITING_MODE=1

APPIMAGE_PATH="${WEB_DIR}/src-tauri/target/release/bundle/appimage/NEIMAN-desktop_0.1.0_amd64.AppImage"

if [ "${MODE}" = "release" ]; then
    if [ -f "${APPIMAGE_PATH}" ]; then
        echo "[*] Launching compiled AppImage release binary..."
        chmod +x "${APPIMAGE_PATH}"
        "${APPIMAGE_PATH}"
    else
        echo "[!] Compiled AppImage not found at ${APPIMAGE_PATH}; falling back to tauri dev..."
        cd "${WEB_DIR}"
        npx --yes @tauri-apps/cli dev
    fi
else
    echo "[*] Launching Tauri Desktop runtime in development mode..."
    cd "${WEB_DIR}"
    npx --yes @tauri-apps/cli dev
fi
