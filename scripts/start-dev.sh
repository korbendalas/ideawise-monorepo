#!/usr/bin/env sh
set -eu

root_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
web_pid=""
mobile_pid=""

cleanup() {
  if [ -n "$web_pid" ] && kill -0 "$web_pid" 2>/dev/null; then
    kill "$web_pid" 2>/dev/null || true
  fi

  if [ -n "$mobile_pid" ] && kill -0 "$mobile_pid" 2>/dev/null; then
    kill "$mobile_pid" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

cd "$root_dir"

echo "Starting backend containers..."
./scripts/docker-compose.sh up -d api

echo "Starting frontend dev server..."
npm run dev:web &
web_pid="$!"

echo "Starting React Native dev server..."
npm run dev:mobile &
mobile_pid="$!"

echo "Development servers are running."
echo "Web:    http://localhost:5173"
echo "Mobile: Expo/Metro output follows in this terminal."
echo "API:    http://localhost:8000/api"

wait "$web_pid" "$mobile_pid"
