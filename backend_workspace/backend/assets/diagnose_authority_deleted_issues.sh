#!/bin/bash
set -e

export SUPABASE_URL="https://kwznqztqlvkeoxjzlhkm.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5JcCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk"
export SUPABASE_DB_URL="postgresql://postgres:Yuktha%401625@db.kwznqztqlvkeoxjzlhkm.supabase.co:5432/postgres"
export BACKEND_API_URL="http://localhost:8000/issues/deleted"

echo "Step 1: Check Supabase for authority-deleted issues..."
python3 backend/assets/check_supabase_authority_deleted_issues.py

echo ""
if python3 backend/assets/check_supabase_authority_deleted_issues.py | grep -q "Found 0"; then
  echo "Step 2: No authority-deleted issues found. Inserting test record..."
  python3 backend/assets/insert_test_authority_deleted_issue.py
  echo "Rechecking Supabase to confirm insert..."
  python3 backend/assets/check_supabase_authority_deleted_issues.py
else
  echo "Authority-deleted issues present, skipping insert."
fi

echo ""
echo "Step 3: Ensure backend server is running..."
if lsof -i:8000 | grep LISTEN; then
  echo "Backend server already running."
  BACKEND_RUNNING_ALREADY=1
else
  cd backend
  (uvicorn src/api/main:app --reload --host 0.0.0.0 --port 8000 > ../backend_server.log 2>&1) &
  BACKEND_PID=$!
  echo "Backend server started with PID $BACKEND_PID"
  sleep 5
  cd ..
fi

echo ""
echo "Step 4: Query backend /issues/deleted endpoint for authority-deleted issues..."
python3 backend/assets/test_query_deleted_issues.py

# Optionally stop backend if started here
if [ -z "$BACKEND_RUNNING_ALREADY" ] && [ ! -z "$BACKEND_PID" ]; then
    echo "Killing backend server..."
    kill $BACKEND_PID
fi
echo "Done diagnosing authority-deleted issues."
