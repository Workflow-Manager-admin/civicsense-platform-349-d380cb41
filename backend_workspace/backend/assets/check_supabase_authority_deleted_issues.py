import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kwznqztqlvkeoxjzlhkm.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
ISSUES_TABLE = "issues"


def main():
    """Query Supabase directly for issues with isDeleted=true and deletedBy='authority'."""
    url = f"{SUPABASE_URL}/rest/v1/{ISSUES_TABLE}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    params = {
        "isDeleted": "eq.true",
        "deletedBy": "eq.authority"
    }
    resp = requests.get(url, headers=headers, params=params)
    print(f"Query status code: {resp.status_code}")
    try:
        results = resp.json()
        print(f"Found {len(results)} authority-deleted issues.")
        for issue in results:
            print(
                "ID: {}, Title: {}, DeletedBy: {}".format(
                    issue.get('id'),
                    issue.get('title'),
                    issue.get('deletedBy'),
                )
            )
    except Exception as e:
        print("Failed to decode response: {} | {}".format(e, resp.text))
    if resp.status_code != 200 or not results:
        print("NOTE: No authority-deleted issues found in Supabase directly.")


if __name__ == "__main__":
    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_KEY is not set in environment!")
    main()
