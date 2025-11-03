from pydantic import BaseModel, ConfigDict, Field, RootModel
from typing import Optional, List, Dict, Any, Union, Literal
from datetime import datetime, timezone

from . import CosmosBaseModel

# Processing status enum
ProcessingStatus = Literal["pending", "processing", "completed", "error"]

class Document(CosmosBaseModel):
    """Document model for Cosmos DB"""
    name: str
    tags: List[str] = []
    opportunity_id: str  # ID of the associated opportunity
    opportunity_name: str  # Name of the associated opportunity
    file_url: str  # URL or path to the document file
    file_type: str  # e.g., "pdf", "docx", etc.
    mime_type: str  # e.g., "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", etc.
    size: int  # Size of the document in bytes
    uploaded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="Timestamp when the document was uploaded")
    uploaded_by: Optional[str] = Field(default=None, description="User ID of the uploader")
    
    # Processing fields
    processing_status: ProcessingStatus = Field(default="pending", description="Current processing status")
    processing_progress: int = Field(default=0, description="Processing progress percentage (0-100)")
    processing_started_at: Optional[str] = Field(default=None, description="Timestamp when processing started")
    processing_completed_at: Optional[str] = Field(default=None, description="Timestamp when processing completed")
    processing_error: Optional[str] = Field(default=None, description="Error message if processing failed")
    processing_stages: Dict[str, Any] = Field(default_factory=dict, description="Status of individual processing stages")

    model_config = ConfigDict(validate_by_name=True)
