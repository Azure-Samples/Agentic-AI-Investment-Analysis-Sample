from datetime import datetime, timezone
import json
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict

class StreamEventMessage(BaseModel):
    """Represents a re-modeled workflow event into an event message suitable for SSE"""

    type: str = Field(description="Type of the event")
    executor: Optional[str] = Field(None, description="ID of the executor")
    data: Optional[Any] = Field(None, description="Event data payload")
    message: Optional[str] = Field(None, description="Optional message")
    sequence: Optional[int] = Field(None, description="Sequence number of the event")
    correlation_id: Optional[str] = Field(None, description="Correlation ID associated with the event")
    timestamp: Optional[str] = Field(datetime.now(timezone.utc).isoformat(), description="Timestamp of the event")
    additional_context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the event")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return {
            "type": self.type,
            "executor": self.executor,
            "data": self.data.to_dict() if self.data and hasattr(self.data, 'to_dict') else self.data,
            "message": self.message,
            "sequence": self.sequence,
            "timestamp": self.timestamp,
            "additional_context": self.additional_context
        }
    
    def to_sse_format(self) -> str:
        """Format event for SSE transmission"""
        event_dict = self.to_dict()
        data_json = json.dumps(event_dict)
        return f"data: {data_json}\n\n"