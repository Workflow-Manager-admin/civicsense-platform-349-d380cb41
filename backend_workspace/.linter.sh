#!/bin/bash
# Defensive linter: Ensure flake8 is globally installed and run it over backend/src/api

set -e

# Try to activate venv if it exists, but don't fail if it doesn't
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Install flake8 globally if not found
if ! command -v flake8 &> /dev/null; then
    pip install flake8
fi

# Determine the location of this script and lint relative to workspace
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
flake8 "$SCRIPT_DIR/backend/src/api/" --max-line-length=120
