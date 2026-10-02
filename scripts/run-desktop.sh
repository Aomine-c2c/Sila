#!/usr/bin/env bash
# ==============================================================================
# NEXORA Desktop Runner — Tauri Execution & Orchestration Script
# ==============================================================================
# Runs the full NEXORA Autonomous Organization OS desktop experience:
# 1. Validates host prerequisites (Cargo/Rust, Node.js, WebKit/GTK).
# 2. Checks/starts the background FastAPI backend (port 8000) if not running.
# 3. Launches the Tauri desktop application hosting the Next.js web workspace.
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${ROOT_DIR}/apps/api"
WEB_DIR="${ROOT_DIR}/apps/web"

API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-3000}"
API_URL="http://127.0.0.1:${API_PORT}"

echo "================================================================="
echo "   NEXORA — Autonomous Organization OS (Tauri Desktop Host)      "
echo "================================================================="

# ------------------------------------------------------------------------------
# 1. Environment & Prerequisite Checks
# ------------------------------------------------------------------------------
command -v cargo >/dev/null 2>&1 || {
    echo "[-] Error: 'cargo' is required to compile and host Tauri." >&2
    exit 1
}

command -v npm >/dev/null 2>&1 || {
    echo "[-] Error: 'npm' is required." >&2
    exit 1
}

command -v uv >/dev/null 2>&1 || {
    echo "[-] Warning: 'uv' not found in PATH; falling back to python -m uvicorn."
}

# ------------------------------------------------------------------------------
# 2. Backend Orchestration (FastAPI API server)
# ------------------------------------------------------------------------------
API_PID=""
cleanup() {
    echo ""
    echo "[*] Shutting down NEXORA Desktop session..."
    if [ -n "${API_PID}" ] && kill -0 "${API_PID}" 2>/dev/null; then
        echo "[*] Stopping backend API server (PID: ${API_PID})..."
        kill "${API_PID}" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "[*] Checking if NEXORA API backend is running on port ${API_PORT}..."
if curl -s --connect-timeout 1 "${API_URL}/api/v1/health" >/dev/null 2>&1 || curl -s --connect-timeout 1 "${API_URL}/health" >/dev/null 2>&1; then
    echo "[+] Found existing backend active at ${API_URL}"
else
    echo "[*] Starting background FastAPI backend on port ${API_PORT}..."
    if command -v uv >/dev/null 2>&1; then
        (cd "${API_DIR}" && uv run uvicorn nexora.main:app --host 127.0.0.1 --port "${API_PORT}" --log-level warning) &
        API_PID=$!
    else
        (cd "${API_DIR}" && python3 -m uvicorn nexora.main:app --host 127.0.0.1 --port "${API_PORT}" --log-level warning) &
        API_PID=$!
    fi

    # Wait up to 10 seconds for backend to become responsive
    echo -n "[*] Waiting for backend readiness..."
    for i in {1..20}; do
        if curl -s --connect-timeout 1 "${API_URL}/api/v1/health" >/dev/null 2>&1 || curl -s --connect-timeout 1 "${API_URL}/health" >/dev/null 2>&1 || curl -s --connect-timeout 1 "${API_URL}/" >/dev/null 2>&1; then
            echo " ready!"
            break
        fi
        sleep 0.5
        echo -n "."
    done
fi

# ------------------------------------------------------------------------------
# 3. Launch Tauri Desktop Application
# ------------------------------------------------------------------------------
echo "[*] Launching Tauri Desktop runtime..."
cd "${WEB_DIR}"
# WebKitGTK stability flags for Linux / Wayland to prevent WebKitWebProcess crashes:
export WEBKIT_DISABLE_COMPOSITING_MODE=1
npx --yes @tauri-apps/cli dev
