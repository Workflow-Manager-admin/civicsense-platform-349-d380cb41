from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


# PUBLIC_INTERFACE
class IssueBase(BaseModel):
    """Base Pydantic model for Issue (shared fields)."""
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    reporter_id: Optional[int] = None
    isDeleted: Optional[bool] = Field(default=False, description="Soft delete flag for issue, true if deleted.")

# PUBLIC_INTERFACE
class IssueCreate(IssueBase):
    """Creation schema for a new issue."""
    pass


# PUBLIC_INTERFACE
class IssueUpdate(IssueBase):
    """Update schema for an existing issue."""
    pass



# PUBLIC_INTERFACE
class IssueInDB(IssueBase):
    """DB representation of an issue including DB only fields."""
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True


# PUBLIC_INTERFACE
class IssueResponse(IssueInDB):
    """API response schema for an issue."""
    pass
