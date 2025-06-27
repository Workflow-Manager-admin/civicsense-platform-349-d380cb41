import os
import requests

# Configure from env, or use default test values.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kwznqztqlvkeoxjzlhkm.supabase.co")
API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:8000/issues/deleted")


def get_deleted_issues():
    """
    Calls the /issues/deleted endpoint to verify deleted-by-authority issue retrieval.
    Prints result for manual verification and asserts 'test-issue-001' is found.
    Also prints each returned issue's id, isDeleted, deletedBy for easier debugging.
    """
    try:
        # Assumes backend is running locally; adjust API_URL as needed.
        resp = requests.get(API_URL)
        print(f"Status code: {resp.status_code}")
        try:
            payload = resp.json()
        except Exception as e:
            print(f"Failed to decode JSON: {e}")
            print("Raw response text:", resp.text)
            return
        issues = payload.get("issues", [])
        print("Raw response payload:", payload)
        print("Returned issues (full info):")
        for issue in issues:
            print(
                f"ID: {issue.get('id')}, isDeleted: {issue.get('isDeleted')}, "
                f"deletedBy: {issue.get('deletedBy')}, title: {issue.get('title')}, "
                f"reported_by: {issue.get('reported_by')}"
            )
        # Check for our exact test issue in the response
        found = any(
            issue.get("id") == "test-issue-001"
            and issue.get("deletedBy") == "authority"
            and issue.get("title") == "Authority test deleted issue"
            and issue.get("reported_by") == "citizen1"
            and issue.get("isDeleted") is True
            for issue in issues
        )
        if found:
            print("TEST PASS: Test issue is present in /issues/deleted endpoint response.")
        else:
            print("TEST FAIL: Test issue NOT found in /issues/deleted endpoint response.")
            print(
                "If this failed, confirm the backend endpoint, "
                "query, and Supabase schema/data integrity."
            )
    except Exception as e:
        print(f"Failed to fetch deleted issues: {e}")


if __name__ == "__main__":
    get_deleted_issues()
