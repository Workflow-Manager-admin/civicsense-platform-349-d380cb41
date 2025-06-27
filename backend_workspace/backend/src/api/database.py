import os
from typing import List, Optional, Dict, Any

import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL")  # Not used directly, API use

BASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


# PUBLIC_INTERFACE
def list_issues(include_deleted: bool = False) -> List[Dict[str, Any]]:
    """Fetches issues from Supabase.
    Args:
        include_deleted (bool): Whether to include soft-deleted issues.
    Returns:
        List of issues from the Supabase table.
    """
    query_url = f"{SUPABASE_URL}/rest/v1/issues"
    params = {"select": "*"}
    if not include_deleted:
        params["is_deleted"] = "eq.false"
    resp = httpx.get(query_url, headers=BASE_HEADERS, params=params)
    resp.raise_for_status()
    return resp.json()


# PUBLIC_INTERFACE
def get_issue(issue_id: int, include_deleted: bool = False) -> Optional[Dict[str, Any]]:
    """Returns the issue by id, optionally including deleted."""
    query_url = f"{SUPABASE_URL}/rest/v1/issues"
    params = {
        "id": f"eq.{issue_id}",
        "select": "*"
    }
    if not include_deleted:
        params["is_deleted"] = "eq.false"
    resp = httpx.get(query_url, headers=BASE_HEADERS, params=params)
    resp.raise_for_status()
    results = resp.json()
    return results[0] if results else None


# PUBLIC_INTERFACE
def soft_delete_issue(issue_id: int) -> bool:
    """Sets is_deleted to True for the issue in Supabase (soft delete)."""
    query_url = f"{SUPABASE_URL}/rest/v1/issues?id=eq.{issue_id}"
    payload = {"is_deleted": True}
    resp = httpx.patch(query_url, headers=BASE_HEADERS, json=payload)
    resp.raise_for_status()
    return resp.status_code == 204 or resp.status_code == 200


# PUBLIC_INTERFACE
def restore_issue(issue_id: int) -> bool:
    """Restores a soft-deleted issue by setting is_deleted to False."""
    query_url = f"{SUPABASE_URL}/rest/v1/issues?id=eq.{issue_id}"
    payload = {"is_deleted": False}
    resp = httpx.patch(query_url, headers=BASE_HEADERS, json=payload)
    resp.raise_for_status()
    return resp.status_code == 204 or resp.status_code == 200
