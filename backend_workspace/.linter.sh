#!/bin/bash
cd /home/kavia/workspace/code-generation/civicsense-platform-349-d380cb41/backend_workspace
source venv/bin/activate
flake8 backend/
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

