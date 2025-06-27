import os
import requests
from datetime import datetime

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kwznqztqlvkeoxjzlhkm.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
ISSUES_TABLE = "issues"


def insert_test_issue():
    """Insert a test issue with isDeleted: true, deletedBy: 'authority'."""
    url = f"{SUPABASE_URL}/rest/v1/{ISSUES_TABLE}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
    }
    now = datetime.utcnow().isoformat()
    test_issue = {
        "id": "test-issue-001",
        "title": "Authority deleted test issue",
        "created_at": "2024-06-01T12:00:00Z",
        "updated_at": now,
        "reported_by": "user123",
        "description": "Issue deleted by authority",
        "isDeleted": True,
        "deletedBy": "authority"
    }
    resp = requests.post(url, headers=headers, json=test_issue)
    print(f"Insert status code: {resp.status_code}")
    try:
        print(resp.json())
    except Exception:
        print(resp.text)


if __name__ == "__main__":
    insert_test_issue()
