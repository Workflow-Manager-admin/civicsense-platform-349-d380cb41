from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# PUBLIC_INTERFACE
class Issue(BaseModel):
    """Represents a reported civic issue."""
    id: str = Field(..., description="Unique identifier for the issue")
    title: str = Field(..., description="Title/summary of the issue reported by citizen")
    description: Optional[str] = Field(None, description="Detailed description of the issue")
    created_at: datetime = Field(..., description="Time the issue was reported")
    updated_at: Optional[datetime] = Field(None, description="Last updated time")
    location: Optional[str] = Field(None, description="Geo-location string or coordinates")
    reported_by: str = Field(..., description="User id of citizen who reported")
    isDeleted: bool = Field(False, description="Whether this issue has been deleted (soft deleted)")
    deletedBy: Optional[str] = Field(
        None,
        description=(
            "Indicates who deleted the issue (e.g. 'authority', "
            "'citizen') if deleted"
        ),
    )
    # Add more fields as per the overall schema (category, priority, etc.), if needed.


# PUBLIC_INTERFACE
class IssueListResponse(BaseModel):
    """Response model for a list of issues."""
    issues: List[Issue]
