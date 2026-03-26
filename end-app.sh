#!/usr/bin/env bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║        TaskFlow — Shutting down       ║"
echo "╚══════════════════════════════════════╝"

# Stop and remove containers and networks (volume is kept to preserve data)
docker compose down

echo ""
echo "✓ All containers stopped and removed."
echo "  Data volume (taskflow-pgdata) is preserved."
echo ""
echo "To also delete all data:  docker volume rm taskflow-pgdata"
