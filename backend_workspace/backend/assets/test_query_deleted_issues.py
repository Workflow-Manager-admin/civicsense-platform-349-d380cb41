import os
import requests

# Configure from env, or use default test values.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kwznqztqlvkeoxjzlhkm.supabase.co")
API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:8000/issues/deleted")


def get_deleted_issues():
    """
    Calls the /issues/deleted endpoint to verify deleted-by-authority issue retrieval.
    Prints result for manual verification.
    """
    try:
        # Assumes backend is running locally; adjust API_URL as needed.
        resp = requests.get(API_URL)
        print(f"Status code: {resp.status_code}")
        print("Response:")
        print(resp.json())
    except Exception as e:
        print(f"Failed to fetch deleted issues: {e}")


if __name__ == "__main__":
    get_deleted_issues()
