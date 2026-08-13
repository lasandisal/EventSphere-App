#!/usr/bin/env bash
# =========================================================
# EventSphere Frontend Local Development Startup Script
# 1. Generates js/env.js from .env (public config only)
# 2. Starts Python's static HTTP server
# =========================================================

set -e

# Change directory to repo root
cd "$(dirname "$0")"

# Step 1: Generate js/env.js
python3 scripts/generate_env.py

# Step 2: Read PORT from .env or default to 8000
PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d '=' -f2 | tr -d ' "\r' || true)
if [ -z "$PORT" ]; then
  PORT=8000
fi

echo ""
echo "========================================================="
echo "EventSphere frontend starting on http://127.0.0.1:${PORT}"
echo "Press Ctrl+C to stop the server."
echo "========================================================="
echo ""

# Step 3: Run static HTTP server bound explicitly to IPv4 loopback
exec python3 -m http.server "$PORT" --bind 127.0.0.1
