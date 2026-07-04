#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: command '$1' was not found." >&2
    exit 1
  fi
}

cleanup() {
  trap - EXIT INT TERM

  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

require_command uv
require_command yarn

if [[ ! -d "$ROOT_DIR/backend/.venv" ]]; then
  echo "Installing backend dependencies..."
  (cd "$ROOT_DIR/backend" && uv sync)
fi

if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT_DIR/frontend" && yarn install)
fi

echo "Starting backend at http://127.0.0.1:8000"
(cd "$ROOT_DIR/backend" && exec uv run python run.py) &
BACKEND_PID=$!

echo "Starting frontend at http://localhost:5173"
(cd "$ROOT_DIR/frontend" && exec yarn dev) &
FRONTEND_PID=$!

echo "Press Ctrl+C to stop both services."

set +e
wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?
set -e

exit "$EXIT_CODE"
