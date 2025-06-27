#!/bin/bash
set -e

# Set Supabase environment variables for check and seed scripts
export SUPABASE_URL="https://kwznqztqlvkeoxjzlhkm.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk"

echo "Checking for authority-deleted issues in Supabase:"
python3 backend/assets/check_supabase_authority_deleted_issues.py

echo ""
if python3 backend/assets/check_supabase_authority_deleted_issues.py | grep -q "Found 0"; then
  echo "No authority-deleted issues found. Inserting a test issue..."
  python3 backend/assets/insert_test_authority_deleted_issue.py

  echo ""
  echo "Rechecking Supabase for authority-deleted issues:"
  python3 backend/assets/check_supabase_authority_deleted_issues.py
else
  echo "Authority-deleted issues already exist; skipping test insert."
fi

echo ""
echo "If insertion fails due to missing schema columns, ensure 'isDeleted' (boolean), 'deletedBy' (text), and 'reported_by' (text) columns exist in your 'issues' table."
echo "You may need to run backend/assets/check_and_update_issues_table.py to add the 'deletedBy' column for compatibility."
