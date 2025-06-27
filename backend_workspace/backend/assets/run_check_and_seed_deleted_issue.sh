#!/bin/bash
set -e

# Set Supabase environment variables for both scripts
export SUPABASE_URL="https://kwznqztqlvkeoxjzlhkm.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5JcCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk"
export SUPABASE_DB_URL="postgresql://postgres:Yuktha%401625@db.kwznqztqlvkeoxjzlhkm.supabase.co:5432/postgres"

echo "Running: Ensure 'deletedBy' column exists in 'issues' table..."
python3 backend/assets/check_and_update_issues_table.py

echo
echo "Running: Insert a test issue with isDeleted=true and deletedBy='authority'..."
python3 backend/assets/insert_test_authority_deleted_issue.py
