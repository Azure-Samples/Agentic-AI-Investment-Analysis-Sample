from pydantic import BaseModel, ConfigDict, Field, RootModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone

from . import CosmosBaseModel

class Analysis(CosmosBaseModel):
    """Analysis model for Cosmos DB"""
    name: str
    tags: List[str] = []
    opportunity_id: str  # ID of the associated opportunity
    investment_hypothesis: Optional[str] = Field(default=None, description="Investment hypothesis for the analysis")
    status: str = Field(default="pending", description="Status: pending, in_progress, completed, failed")
    agent_results: Dict[str, Any] = Field(default_factory=dict, description="Results from each agent")
    result: Optional[str] = Field(default=None, description="Final result summary of the analysis")
    started_at: Optional[str] = Field(default=None, description="Timestamp when the analysis started")
    completed_at: Optional[str] = Field(default=None, description="Timestamp when the analysis completed")
    error_details: Optional[Dict[str, Any]] = Field(default=None, description="Error details if the analysis failed")
    owner_id: str  # User ID of the owner
    events: List[Dict[str, Any]] = Field(default_factory=list, description="List of event messages related to the analysis")
    is_active: bool = True

    model_config = ConfigDict(validate_by_name=True)
