from pydantic import BaseModel, Field


# PUBLIC_INTERFACE
class Issue(BaseModel):
    """
    Pydantic model representing an issue/complaint in the system.
    """
    id: int = Field(..., description="Unique identifier for the issue")
    title: str = Field(..., description="Title/subject of the issue")
    description: str = Field(..., description="Detailed description of the issue")
    # Add other relevant fields (category, status, geo, etc.) as needed
    is_deleted: bool = Field(False, description="Flag if the issue is soft deleted")
    # You can add extra fields if needed for the schema
