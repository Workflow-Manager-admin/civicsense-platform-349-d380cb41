import os
import requests

# Configure from env, or use default test values.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kwznqztqlvkeoxjzlhkm.supabase.co")
API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:8000/issues/deleted")


def get_deleted_issues():
    """
    Calls the /issues/deleted endpoint to verify deleted-by-authority issue retrieval.
    Prints result for manual verification and asserts 'test-issue-001' is found.
    """
    try:
        # Assumes backend is running locally; adjust API_URL as needed.
        resp = requests.get(API_URL)
        print(f"Status code: {resp.status_code}")
        issues = resp.json().get("issues", [])
        print("Response:")
        print(issues)
        # Check for our exact test issue in the response
        found = any(
            issue.get("id") == "test-issue-001"
            and issue.get("deletedBy") == "authority"
            and issue.get("title") == "Authority test deleted issue"
            and issue.get("reported_by") == "citizen1"
            for issue in issues
        )
        if found:
            print("TEST PASS: Test issue is present in /issues/deleted endpoint response.")
        else:
            print("TEST FAIL: Test issue NOT found in /issues/deleted endpoint response.")
    except Exception as e:
        print(f"Failed to fetch deleted issues: {e}")


if __name__ == "__main__":
    get_deleted_issues()
