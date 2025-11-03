from pydantic import BaseModel, ConfigDict, Field, RootModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone

from . import CosmosBaseModel

class User(CosmosBaseModel):
    """User document model for Cosmos DB"""
    email: str
    full_name: Optional[str] = None
    is_active: bool = True

    model_config = ConfigDict(validate_by_name=True)
