#!/bin/bash
set -e

export SUPABASE_URL="https://kwznqztqlvkeoxjzlhkm.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5JcCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk"

# For check_and_update_issues_table.py, needs SUPABASE_DB_URL from the 3rd_party_services
export SUPABASE_DB_URL="postgresql://postgres:Yuktha%401625@db.kwznqztqlvkeoxjzlhkm.supabase.co:5432/postgres"

echo "Ensuring 'deletedBy' column exists in Supabase 'issues' table..."
python3 backend/assets/check_and_update_issues_table.py

echo "Inserting test issue with isDeleted=true and deletedBy='authority'..."
python3 backend/assets/insert_test_authority_deleted_issue.py
