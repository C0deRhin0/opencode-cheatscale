#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/scripts/portable-harness.cjs"

if ! command -v node >/dev/null 2>&1; then
  printf 'Error: node is required to run the CheatScale portable harness exporter.\n' >&2
  exit 1
fi

exec node "$NODE_SCRIPT" "$@"
