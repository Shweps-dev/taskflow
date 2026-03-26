#!/usr/bin/env bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║        TaskFlow — Starting up         ║"
echo "╚══════════════════════════════════════╝"

# Check .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in secrets."
  exit 1
fi

# Build images and start all containers
docker compose up --build -d

echo ""
echo "✓ All containers started."
echo ""
echo "  App:     http://localhost:${FRONTEND_PORT:-8080}"
echo ""
echo "To view logs:  docker compose logs -f"
echo "To stop:       ./end-app.sh"
