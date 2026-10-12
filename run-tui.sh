#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR/apps/tui-rs"

# Run compiled release binary if present, otherwise cargo run
if [ -f "$ROOT_DIR/apps/tui-rs/target/release/tui-rs" ]; then
    exec "$ROOT_DIR/apps/tui-rs/target/release/tui-rs" "$@"
elif [ -f "$ROOT_DIR/apps/tui-rs/target/debug/tui-rs" ]; then
    exec "$ROOT_DIR/apps/tui-rs/target/debug/tui-rs" "$@"
else
    exec cargo run --release -- "$@"
fi

