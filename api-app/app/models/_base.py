from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone
import uuid

class CosmosBaseModel(BaseModel):
    """Base model for Cosmos DB documents"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

