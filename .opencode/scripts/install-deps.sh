#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OCS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$OCS_ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to install OpenCode CheatScale plugin dependencies." >&2
  exit 1
fi

npm install
npm run build

echo "OpenCode CheatScale dependencies installed and plugin build verified."
