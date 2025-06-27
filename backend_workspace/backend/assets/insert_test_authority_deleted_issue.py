import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kwznqztqlvkeoxjzlhkm.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
ISSUES_TABLE = "issues"


def insert_test_issue():
    """Insert a test issue with isDeleted: true, deletedBy: 'authority' using specified test_issue_details."""
    url = f"{SUPABASE_URL}/rest/v1/{ISSUES_TABLE}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer":
            "resolution=merge-duplicates,return=representation"
    }
    # Use the issue details as per the work item, match the created_at value
    test_issue = {
        "id": "test-issue-001",
        "title": "Authority test deleted issue",
        "created_at":
            "2024-06-12T12:00:00.000Z",
        "updated_at":
            "2024-06-12T12:00:00.000Z",
        "reported_by": "citizen1",
        "description": "Issue deleted by authority",
        "isDeleted": True,
        "deletedBy": "authority",
    }
    resp = requests.post(url, headers=headers, json=test_issue)
    print(f"Insert status code: {resp.status_code}")
    try:
        print(resp.json())
    except Exception:
        print(resp.text)


if __name__ == "__main__":
    # Help debugging: print API key info
    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_KEY is not set in environment!")
    else:
        print("SUPABASE_KEY loaded, length:", len(SUPABASE_KEY))
    if not SUPABASE_URL:
        print("ERROR: SUPABASE_URL is not set in environment!")
    insert_test_issue()
