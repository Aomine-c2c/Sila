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

mkdir -p "${BIN_DIR}" "${APPS_DIR}" "${ICONS_DIR}" "${DATA_DIR}"

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

echo "[*] Ensuring Web frontend dependencies are installed..."
cd "${REPO_DIR}/apps/web"
if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS=true" > .env.local
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env.local
fi
if [ ! -d "node_modules" ]; then
    npm install --prefer-offline
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

echo "================================================================="
echo "   NEIMAN OS — Checking and Pulling Updates from GitHub          "
echo "================================================================="

cd "${REPO_DIR}"

echo "[*] Fetching latest refs from GitHub (origin)..."
git fetch origin

CURRENT_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse origin/main)"

if [ "${CURRENT_COMMIT}" = "${REMOTE_COMMIT}" ]; then
    echo "[+] System is already up to date at commit: ${CURRENT_COMMIT:0:7}"
    echo "[*] Checking database migrations..."
    cd "${REPO_DIR}/apps/api"
    uv sync
    uv run alembic upgrade head
    echo "[+] System update check complete."
    exit 0
fi

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

echo "[*] Syncing Python dependencies & upgrading database migrations..."
cd "${REPO_DIR}/apps/api"
uv sync
uv run alembic upgrade head

echo "[*] Rebuilding production frontend bundle..."
cd "${REPO_DIR}/apps/web"
npm install --prefer-offline
rm -rf .next
npm run build

echo "[*] Rebuilding desktop binary..."
npx tauri build --no-bundle

echo "================================================================="
echo "[+] NEIMAN successfully updated to ${REMOTE_COMMIT:0:7}!"
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
