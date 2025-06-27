from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from .issue_models import Issue, IssueListResponse
from datetime import datetime
import os
import httpx

ISSUES_TABLE = "issues"

router = APIRouter(prefix="/issues", tags=["Issues"])


def get_supabase_params():
    """Fetch Supabase URL and KEY from environment variables."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("Supabase configuration missing in environment variables.")
    return url, key


async def fetch_issues_from_supabase(is_deleted: Optional[bool] = None) -> List[Issue]:
    """Fetch issues from Supabase table."""
    url, key = get_supabase_params()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    params = {}
    if is_deleted is True:
        params["isDeleted"] = "eq.true"
    elif is_deleted is False:
        params["isDeleted"] = "eq.false"
    full_url = f"{url}/rest/v1/{ISSUES_TABLE}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(full_url, headers=headers, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch issues.")
        return [Issue(**item) for item in resp.json()]


async def update_issue_isdeleted(issue_id: str) -> None:
    """Soft-delete an issue: sets isDeleted = true in Supabase."""
    url, key = get_supabase_params()
    full_url = f"{url}/rest/v1/{ISSUES_TABLE}?id=eq.{issue_id}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    data = {"isDeleted": True, "updated_at": datetime.utcnow().isoformat()}
    async with httpx.AsyncClient() as client:
        resp = await client.patch(full_url, headers=headers, json=data)
        if resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail="Failed to soft-delete issue")


# --- AUTHORITY AUTH (Placeholder) ---


def authority_required():
    """
    Placeholder for authority authentication.
    Replace with proper dependency.
    """
    # In production, replace with real authority check
    return True


# --- ROUTES ---


# PUBLIC_INTERFACE
@router.get("/", response_model=IssueListResponse, summary="List non-deleted issues")
async def list_issues(
    include_deleted: Optional[bool] = Query(False, description="Include deleted issues"),
    authority: bool = Depends(authority_required)
):
    """
    Returns all issues. By default only non-deleted issues are returned.
    Set include_deleted=true to fetch deleted issues (only for authorities).
    """
    if include_deleted:
        if not authority:
            raise HTTPException(status_code=403, detail="Not authorized to see deleted issues.")
        issues = await fetch_issues_from_supabase(is_deleted=True)
    else:
        issues = await fetch_issues_from_supabase(is_deleted=False)
    return IssueListResponse(issues=issues)


# PUBLIC_INTERFACE
@router.patch("/{issue_id}/delete", status_code=204, summary="Soft-delete an issue")
async def soft_delete_issue(issue_id: str, user: str = "citizen"):
    """
    Sets 'isDeleted' to true for the specified issue (soft delete).
    Only allowed by the user who reported this issue or admin.
    """
    # TODO: Add user authorization logic, replace 'user'
    await update_issue_isdeleted(issue_id)
    return


# PUBLIC_INTERFACE
@router.get(
    "/deleted",
    response_model=IssueListResponse,
    summary="[Authority] List all deleted issues"
)
async def list_deleted_issues(authority: bool = Depends(authority_required)):
    """
    Lists all issues where isDeleted is true (deleted issues).
    Only available to authorities.
    """
    if not authority:
        raise HTTPException(status_code=403, detail="Not authorized to see deleted issues.")
    issues = await fetch_issues_from_supabase(is_deleted=True)
    return IssueListResponse(issues=issues)
