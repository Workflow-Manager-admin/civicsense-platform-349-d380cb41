from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List

from ..models.issue import Issue
from ..schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from ..database import get_db  # You must have a get_db dependency for session management

router = APIRouter(prefix="/issues", tags=["Issues"])


# PUBLIC_INTERFACE
@router.get("/", response_model=List[IssueResponse])
def list_issues(show_deleted: bool = False, db: Session = Depends(get_db)):
    """
    List all issues.

    - If show_deleted is False, only return non-deleted issues.
    - If show_deleted is True, return all issues including soft-deleted ones.
    """
    if show_deleted:
        issues = db.query(Issue).all()
    else:
        issues = db.query(Issue).filter(not Issue.isDeleted).all()
    return issues


# PUBLIC_INTERFACE
@router.get("/deleted", response_model=List[IssueResponse])
def list_deleted_issues(db: Session = Depends(get_db)):
    """
    List all issues that are soft deleted (isDeleted == True).
    """
    deleted_issues = db.query(Issue).filter(Issue.isDeleted).all()
    return deleted_issues


# PUBLIC_INTERFACE
@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(issue_id: int, db: Session = Depends(get_db)):
    """
    Get an issue by its ID if it has not been soft deleted.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id, not Issue.isDeleted).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


# PUBLIC_INTERFACE
@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(issue_create: IssueCreate, db: Session = Depends(get_db)):
    """
    Create a new issue (isDeleted is always set to False initially).
    """
    db_issue = Issue(**issue_create.dict(exclude_unset=True))
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    return db_issue


# PUBLIC_INTERFACE
@router.put("/{issue_id}", response_model=IssueResponse)
def update_issue(issue_id: int, issue_update: IssueUpdate, db: Session = Depends(get_db)):
    """
    Update issue details. Cannot update a soft-deleted issue.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id, not Issue.isDeleted).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found or already deleted")
    update_data = issue_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(issue, field, value)
    db.commit()
    db.refresh(issue)
    return issue


# PUBLIC_INTERFACE
@router.delete("/{issue_id}", response_model=IssueResponse)
def soft_delete_issue(issue_id: int, db: Session = Depends(get_db)):
    """
    Soft delete an issue (set isDeleted to True, do not remove from database).
    """
    issue = db.query(Issue).filter(Issue.id == issue_id, not Issue.isDeleted).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found or already deleted")
    issue.isDeleted = True
    db.commit()
    db.refresh(issue)
    return issue
