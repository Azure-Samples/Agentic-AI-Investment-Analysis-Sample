from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from . import CosmosBaseModel

class AnalysisWorkflowEvent(CosmosBaseModel):
    """Workflow Event model for Cosmos DB"""
    analysis_id: str = Field(description="ID of the associated analysis")
    opportunity_id: str = Field(description="ID of the associated opportunity")
    owner_id: str = Field(description="User ID of the owner")
    type: str = Field(description="Type of the event (e.g., workflow_started, executor_invoked, etc.)")
    executor: Optional[str] = Field(default=None, description="ID of the executor that triggered the event")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Event data payload")
    message: Optional[str] = Field(default=None, description="Optional message describing the event")
    sequence: int = Field(description="Sequence number of the event within the workflow")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="Timestamp when the event occurred")
    is_deleted: bool = False

    model_config = ConfigDict(validate_by_name=True)
