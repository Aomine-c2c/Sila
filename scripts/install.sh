#!/usr/bin/env bash
# ==============================================================================
# NEIMAN OS — System Installer & Update Manager
# ==============================================================================
# Installs NEIMAN onto the local Linux workstation:
# 1. Links/copies binaries and launch commands into ~/.local/bin/neiman
# 2. Creates desktop entry in ~/.local/share/applications/neiman.desktop
# 3. Installs high-resolution application icon
# 4. Sets up updater tool (~/.local/bin/neiman-update) to pull updates from GitHub
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd -P "${SCRIPT_DIR}/.." && pwd)"
BIN_DIR="${HOME}/.local/bin"
APPS_DIR="${HOME}/.local/share/applications"
ICONS_DIR="${HOME}/.local/share/icons/hicolor/512x512/apps"
DATA_DIR="${HOME}/.local/share/neiman"

echo "================================================================="
echo "   NEIMAN Autonomous Organization OS — System Installation       "
echo "================================================================="

SKIP_BUILD=0
RESET_DB=0
API_PORT="8000"
WEB_PORT="3000"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-build)
            SKIP_BUILD=1
            shift
            ;;
        --reset-db|--clean|-c)
            RESET_DB=1
            shift
            ;;
        --api-port)
            API_PORT="$2"
            shift 2
            ;;
        --web-port)
            WEB_PORT="$2"
            shift 2
            ;;
        --update)
            # Accepted for compatibility with neiman-update
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-build       Skip compiling desktop binaries and frontend bundles"
            echo "  --reset-db, -c     Wipe existing local database and start with clean migrations"
            echo "  --api-port PORT    Configure API backend port (default: 8000)"
            echo "  --web-port PORT    Configure Web frontend port (default: 3000)"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

mkdir -p "${BIN_DIR}" "${APPS_DIR}" "${ICONS_DIR}" "${DATA_DIR}"

if [ "${RESET_DB}" -eq 1 ]; then
    echo "[*] Database reset requested: cleaning up old database files..."
    rm -f "${DATA_DIR}/production.db"* "${REPO_DIR}/apps/api/NEIMAN.db"* "${REPO_DIR}/apps/api/nexora.db"* 2>/dev/null || true
fi

# 0. Ensure environment and dependencies are ready
echo "[*] Setting up API environment and dependencies..."
cd "${REPO_DIR}/apps/api"
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi
if command -v uv >/dev/null 2>&1; then
    uv sync
fi

echo "[*] Ensuring local database schema is migrated..."
if command -v uv >/dev/null 2>&1; then
    uv run alembic upgrade head
fi
cd "${REPO_DIR}"

echo "[*] Ensuring Web frontend dependencies are installed..."
cd "${REPO_DIR}/apps/web"
if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS=true" > .env.local
    echo "NEXT_PUBLIC_API_URL=http://localhost:${API_PORT}" >> .env.local
fi
if [ ! -d "node_modules" ]; then
    npm install --prefer-offline --no-fund
    npm audit fix --prefer-offline 2>/dev/null || true
fi
cd "${REPO_DIR}"

# Build desktop binary if not already compiled and not skipped
STANDALONE_BIN="${REPO_DIR}/apps/web/src-tauri/target/release/app"
if [ "${SKIP_BUILD}" -eq 0 ] && [ ! -f "${STANDALONE_BIN}" ]; then
    echo "[*] Compiling NEIMAN desktop application binary (this takes ~1-2 min on initial install)..."
    cd "${REPO_DIR}/apps/web"
    rm -rf .next
    npm run build
    npx tauri build --no-bundle
    cd "${REPO_DIR}"
fi

cd "${REPO_DIR}"

# 1. Install Icons
echo "[*] Installing application icons..."
mkdir -p "${HOME}/.local/share/icons/hicolor/32x32/apps" \
         "${HOME}/.local/share/icons/hicolor/128x128/apps" \
         "${HOME}/.local/share/icons/hicolor/512x512/apps"

cp "${REPO_DIR}/apps/web/src-tauri/icons/32x32.png" "${HOME}/.local/share/icons/hicolor/32x32/apps/neiman.png" 2>/dev/null || true
cp "${REPO_DIR}/apps/web/src-tauri/icons/128x128.png" "${HOME}/.local/share/icons/hicolor/128x128/apps/neiman.png" 2>/dev/null || true
cp "${REPO_DIR}/apps/web/src-tauri/icons/icon.png" "${HOME}/.local/share/icons/hicolor/512x512/apps/neiman.png" 2>/dev/null || true

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t "${HOME}/.local/share/icons/hicolor" 2>/dev/null || true
fi

# 2. Install Runner Command (neiman)
echo "[*] Installing CLI launcher to ${BIN_DIR}/neiman..."
cat << 'EOF' > "${BIN_DIR}/neiman"
#!/usr/bin/env bash
set -euo pipefail

# Find repo root
REPO_DIR="%%REPO_DIR%%"

if [ ! -d "${REPO_DIR}" ]; then
    echo "Error: NEIMAN repository not found at ${REPO_DIR}" >&2
    exit 1
fi

exec "${REPO_DIR}/run-desktop.sh" "$@"
EOF

sed -i "s|%%REPO_DIR%%|${REPO_DIR}|g" "${BIN_DIR}/neiman"
chmod +x "${BIN_DIR}/neiman"

# 3. Install Update Tool (neiman-update)
echo "[*] Installing updater utility to ${BIN_DIR}/neiman-update..."
cat << 'EOF' > "${BIN_DIR}/neiman-update"
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="%%REPO_DIR%%"
FORCE_REBUILD=0
RESET_DB=0

for arg in "$@"; do
    case "$arg" in
        --rebuild|-f|--force)
            FORCE_REBUILD=1
            ;;
        --reset-db|--clean|-c)
            RESET_DB=1
            ;;
        -h|--help)
            echo "Usage: neiman-update [options]"
            echo ""
            echo "Options:"
            echo "  --rebuild, -f      Force rebuild frontend bundle and Rust desktop binary"
            echo "  --reset-db, -c     Archive current database and start with a fresh clean state"
            echo "  --help, -h         Show this help message"
            exit 0
            ;;
    esac
done

echo "================================================================="
echo "   NEIMAN OS — Checking and Pulling Updates from GitHub          "
echo "================================================================="

cd "${REPO_DIR}"

echo "[*] Fetching latest refs from GitHub (origin)..."
git fetch origin

CURRENT_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse origin/main)"

REBUILD_NEEDED=0

if [ "${CURRENT_COMMIT}" != "${REMOTE_COMMIT}" ]; then
    echo "[*] New changes detected (${CURRENT_COMMIT:0:7} -> ${REMOTE_COMMIT:0:7}). Pulling..."
    STASHED=0
    if [ -n "$(git status --porcelain)" ]; then
        echo "[*] Stashing local changes before updating..."
        git stash push -m "neiman-update-autostash"
        STASHED=1
    fi

    git pull origin main

    if [ "${STASHED}" -eq 1 ]; then
        echo "[*] Restoring stashed local changes..."
        git stash pop || true
    fi
    REBUILD_NEEDED=1
elif [ "${FORCE_REBUILD}" -eq 1 ]; then
    echo "[*] Force rebuild requested (--rebuild). Recompiling stack..."
    REBUILD_NEEDED=1
else
    echo "[+] Repository is up to date at commit: ${CURRENT_COMMIT:0:7}"
    echo "[*] Tip: Run 'neiman-update --rebuild' to force rebuild binaries."
    echo "[*] Tip: Run 'neiman-update --reset-db' to wipe and start from clean state."
fi

DATA_DIR="${HOME}/.local/share/neiman"
mkdir -p "${DATA_DIR}"
DB_FILE="${DATA_DIR}/production.db"

if [ "${RESET_DB}" -eq 1 ]; then
    echo "[*] Database reset requested (--reset-db)..."
    if [ -f "${DB_FILE}" ]; then
        DATE_STAMP="$(date +%Y%m%d_%H%M%S)"
        echo "[*] Archiving current database to ${DATA_DIR}/production_${DATE_STAMP}.db.bak..."
        mv "${DB_FILE}" "${DATA_DIR}/production_${DATE_STAMP}.db.bak"
        rm -f "${DB_FILE}-wal" "${DB_FILE}-shm"
    fi

    WEBVIEW_STORAGE="${HOME}/.local/share/org.NEIMAN.desktop/localstorage"
    if [ -d "${WEBVIEW_STORAGE}" ]; then
        echo "[*] Resetting cached WebView localStorage..."
        rm -rf "${WEBVIEW_STORAGE}"
    fi
    echo "[+] Fresh database and workspace prepared."
else
    echo "[*] Preserving existing database: ${DB_FILE}"
fi

echo "[*] Syncing Python dependencies & creating fresh database schema..."
cd "${REPO_DIR}/apps/api"
if command -v uv >/dev/null 2>&1; then
    uv sync
    DATABASE_URL="sqlite+aiosqlite:///${DB_FILE}" uv run alembic upgrade head
    echo "[+] Clean operational database initialized successfully."
fi

if [ "${REBUILD_NEEDED}" -eq 1 ]; then
    echo "[*] Rebuilding production frontend bundle..."
    cd "${REPO_DIR}/apps/web"
    npm install --prefer-offline --no-fund
    echo "[*] Resolving npm audit vulnerabilities..."
    npm audit fix --prefer-offline 2>/dev/null || true
    rm -rf .next
    npm run build

    echo "[*] Rebuilding Rust native desktop binary (Tauri)..."
    npx tauri build --no-bundle
    echo "[+] Rust desktop binary compiled successfully."
fi

echo "================================================================="
echo "[+] NEIMAN update routine completed successfully!"
echo "================================================================="
EOF

sed -i "s|%%REPO_DIR%%|${REPO_DIR}|g" "${BIN_DIR}/neiman-update"
chmod +x "${BIN_DIR}/neiman-update"

# 4. Install Desktop Entry (.desktop)
echo "[*] Registering desktop application entry..."
cat << EOF > "${APPS_DIR}/neiman.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=NEIMAN
GenericName=Autonomous Organization OS
Comment=NEIMAN — Multi-Agent Autonomous Organization Operating System
Exec=${BIN_DIR}/neiman
Icon=neiman
Terminal=false
Categories=Development;Office;Utility;
Keywords=neiman;autonomous;ai;agent;organization;
StartupNotify=true
StartupWMClass=NEIMAN-desktop
EOF

chmod +x "${APPS_DIR}/neiman.desktop"

# Refresh desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "${APPS_DIR}" 2>/dev/null || true
fi

# 5. Integrate with Omarchy Menu if available
OMARCHY_EXT="${HOME}/.config/omarchy/extensions/omarchy-menu.jsonc"
if [ -d "${HOME}/.config/omarchy/extensions" ] || [ -f "${OMARCHY_EXT}" ]; then
    echo "[*] Registering with Omarchy launcher menu..."
    mkdir -p "${HOME}/.config/omarchy/extensions"
    if [ ! -f "${OMARCHY_EXT}" ]; then
        echo "{}" > "${OMARCHY_EXT}"
    fi
    if ! grep -q "apps.neiman" "${OMARCHY_EXT}" 2>/dev/null; then
        python3 -c "
import json
path = '${OMARCHY_EXT}'
with open(path, 'r') as f:
    raw = f.read()
# Inject before last closing brace
neiman_entry = '''  // >>> neiman-app
  \"apps.neiman\": {
    \"icon\": \"󰚩\",
    \"label\": \"NEIMAN\",
    \"description\": \"Autonomous Organization OS\",
    \"aliases\": [\"neiman\", \"ai\", \"organization\", \"agents\"],
    \"action\": \"${BIN_DIR}/neiman\"
  },
  // <<< neiman-app\n'''
if '}' in raw:
    idx = raw.rfind('}')
    updated = raw[:idx] + neiman_entry + raw[idx:]
    with open(path, 'w') as f:
        f.write(updated)
" 2>/dev/null || true
    fi
    if command -v omarchy-menu >/dev/null 2>&1; then
        omarchy-menu refresh 2>/dev/null || true
    fi
fi

echo ""
echo "================================================================="
echo "[+] Installation complete!"
echo ""
echo "  • Desktop App: Available in application launcher / search as 'NEIMAN'"
echo "  • Terminal:    Run 'neiman' anywhere"
echo "  • Updates:     Run 'neiman-update' to pull latest changes from GitHub"
echo "================================================================="
