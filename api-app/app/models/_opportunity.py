from pydantic import BaseModel, ConfigDict, Field, RootModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone

from . import CosmosBaseModel

class Opportunity(CosmosBaseModel):
    """Opportunity document model for Cosmos DB"""
    name: str
    display_name: str
    description: str
    owner_id: str  # User ID of the owner
    settings: Dict[str, Any] = {}  # settings for executor initialization
    is_active: bool = True

    model_config = ConfigDict(validate_by_name=True)
