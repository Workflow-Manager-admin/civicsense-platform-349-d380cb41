#!/bin/bash
set -e

echo "Step 1: Ensure 'deletedBy' column exists in issues table..."
python3 "$(dirname "$0")/check_and_update_issues_table.py"

echo "Step 2: Start backend server in the background (if not running already)..."
# Checks if 8000 already in use
if lsof -i:8000 | grep LISTEN; then
  echo "Backend server already running."
  BACKEND_RUNNING_ALREADY=1
else
  # Activate venv if exists
  if [ -f ../../venv/bin/activate ]; then
    source ../../venv/bin/activate
  fi
  cd ..
  (uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000 > backend_server.log 2>&1) &
  BACKEND_PID=$!
  echo "Backend server started with PID $BACKEND_PID"
  sleep 5
fi

echo "Step 3: Insert test record via insert_test_authority_deleted_issue.py..."
python3 "$(dirname "$0")/insert_test_authority_deleted_issue.py"

echo "Step 4: Query /issues/deleted endpoint using test_query_deleted_issues.py..."
python3 "$(dirname "$0")/test_query_deleted_issues.py"

if [ -z "$BACKEND_RUNNING_ALREADY" ] && [ ! -z "$BACKEND_PID" ]; then
    echo "Killing backend server..."
    kill $BACKEND_PID
fi
echo "All steps finished."
