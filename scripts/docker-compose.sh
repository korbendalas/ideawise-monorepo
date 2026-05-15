#!/usr/bin/env sh
set -eu

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
fi

if command -v docker-compose >/dev/null 2>&1; then
  exec docker-compose "$@"
fi

if [ -x /usr/local/bin/docker-compose ]; then
  exec /usr/local/bin/docker-compose "$@"
fi

echo "Docker Compose was not found. Install Docker Desktop or add docker-compose to PATH." >&2
exit 127
