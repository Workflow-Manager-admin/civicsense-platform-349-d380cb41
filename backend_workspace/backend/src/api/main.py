from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from .models import Issue
from .database import list_issues, get_issue, soft_delete_issue, restore_issue

app = FastAPI(
    title="CivicSense Backend",
    description=(
        "Backend API for CivicSense Smart City platform "
        "(issues management, including soft-delete support)."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "Issues", "description": "Endpoints to manage public complaints/issues"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint for the service."""
    return {"message": "Healthy"}


# PUBLIC_INTERFACE
@app.get(
    "/issues",
    response_model=List[Issue],
    tags=["Issues"],
    summary="List all non-deleted issues",
)
def api_list_issues():
    """Returns all issues that are not deleted."""
    return list_issues(include_deleted=False)


# PUBLIC_INTERFACE
@app.get(
    "/issues/deleted",
    response_model=List[Issue],
    tags=["Issues"],
    summary="List all deleted issues",
)
def api_list_deleted_issues():
    """Returns all deleted issues."""
    return list_issues(include_deleted=True)


# PUBLIC_INTERFACE
@app.get(
    "/issues/{issue_id}",
    response_model=Issue,
    tags=["Issues"],
    summary="Get a specific issue by id",
)
def api_get_issue(issue_id: int):
    """Get a single issue by its unique id, if not deleted."""
    issue = get_issue(issue_id, include_deleted=False)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


# PUBLIC_INTERFACE
@app.delete(
    "/issues/{issue_id}",
    tags=["Issues"],
    summary="Soft-delete an issue",
)
def api_soft_delete_issue(issue_id: int):
    """
    Soft-delete an issue.
    Marks the issue as deleted by setting 'is_deleted=True'.
    """
    if soft_delete_issue(issue_id):
        return {"message": "Issue soft-deleted successfully"}
    raise HTTPException(
        status_code=404, detail="Issue not found or could not be soft-deleted"
    )


# PUBLIC_INTERFACE
@app.post(
    "/issues/{issue_id}/restore",
    tags=["Issues"],
    summary="Restore a soft-deleted issue",
)
def api_restore_issue(issue_id: int):
    """
    Restore a soft-deleted issue.
    Sets 'is_deleted=False' for the specified issue.
    """
    if restore_issue(issue_id):
        return {"message": "Issue restored successfully"}
    raise HTTPException(
        status_code=404, detail="Issue not found or could not be restored"
    )
