#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR/apps/api"
exec uv run python -m nexora.tui.app "$@"
