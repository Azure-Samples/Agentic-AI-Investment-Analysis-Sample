from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from . import CosmosBaseModel

class WhatIfMessage(BaseModel):
    """Chat Message document model for Cosmos DB"""
    
    msg_id: str = Field(..., description="Unique identifier for the message")
    role: str = Field(..., description="Role of the message sender (e.g., 'user', 'assistant', 'system')")
    text: Optional[str] = Field(None, description="Text content of the message")
    content: Optional[str | Dict[str, Any]] = Field(None, description="Content of the message (can be string or structured content)")
    author: Optional[str] = Field(None, description="Optional name of the sender")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata for the message")
    sequence_number: Optional[int] = Field(None, description="Optional sequence number of the message in the conversation")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    model_config = ConfigDict(
        validate_by_name=True,
        populate_by_name=True
    )


class WhatIfConversation(CosmosBaseModel):
    """Conversation document model for Cosmos DB"""
    
    user_id: str = Field(..., description="User ID that owns this conversation")
    conversation_id: str = Field(..., description="Conversation ID that this conversation belongs to")
    analysis_id: str = Field(..., description="Analysis ID associated with this conversation")
    title: Optional[str] = Field(None, description="Title of the conversation")
    messages: Optional[List[WhatIfMessage]] = Field(default_factory=list, description="List of messages in the conversation")
    
    model_config = ConfigDict(
        validate_by_name=True,
        populate_by_name=True
    )