"""
Event Queue Manager for Analysis Workflow Events
Implements a queue-based approach for SSE event streaming with persistence
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from collections import defaultdict, deque
import asyncio
import json
import logging
from pydantic import BaseModel, Field

logger = logging.getLogger("app.workflow.event_queue")

class EventMessage(BaseModel):
    """Represents a re-modeled workflow event into an event message suitable for SSE"""

    type: str = Field(description="Type of the event")
    executor: Optional[str] = Field(None, description="ID of the executor")
    data: Optional[Any] = Field(None, description="Event data payload")
    message: Optional[str] = Field(None, description="Optional message")
    sequence: Optional[int] = Field(None, description="Sequence number of the event")
    timestamp: Optional[str] = Field(datetime.now(timezone.utc).isoformat(), description="Timestamp of the event")
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return {
            "type": self.type,
            "executor": self.executor,
            "data": self.data.to_dict() if self.data and hasattr(self.data, 'to_dict') else self.data,
            "message": self.message,
            "sequence": self.sequence,
            "timestamp": self.timestamp
        }
    
    def to_sse_format(self) -> str:
        """Format event for SSE transmission"""
        event_dict = self.to_dict()
        data_json = json.dumps(event_dict)
        return f"data: {data_json}\n\n"


class EventQueue:
    """Manages event queues for analysis workflows with persistence"""
    
    def __init__(self, max_events_per_analysis: int = 1000):
        # Store events per analysis_id
        self._queues: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_events_per_analysis))
        # Track event sequence numbers
        self._sequence_numbers: Dict[str, int] = defaultdict(int)
        # Track active listeners (for live streaming)
        self._listeners: Dict[str, List[asyncio.Queue]] = defaultdict(list)
        # Lock for thread safety
        self._lock = asyncio.Lock()
        self._max_events = max_events_per_analysis
        
    async def add_event_message(
        self,
        analysis_id: str,
        event_type: str,
        executor: Optional[str] = None,
        data: Optional[Any] = None,
        message: Optional[str] = None
    ) -> EventMessage:
        """Add an event to the queue for a specific analysis"""
        async with self._lock:
            event_msg = EventMessage(
                type=event_type,
                executor=executor,
                data=data,
                message=message,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            
            # Add sequence number to event data
            seq = self._sequence_numbers[analysis_id]
            event_msg.sequence = seq
            self._sequence_numbers[analysis_id] += 1
            
            # Store event
            self._queues[analysis_id].append(event_msg)
            
            # Notify active listeners
            if analysis_id in self._listeners:
                for listener_queue in self._listeners[analysis_id]:
                    try:
                        await listener_queue.put(event_msg)
                    except Exception as e:
                        logger.error(f"Error notifying listener: {str(e)}")

            logger.debug(f"Added event to analysis {analysis_id}: {event_msg.type} - {event_msg.executor}")
            
            return event_msg

    async def get_events(
        self,
        analysis_id: str,
        since_sequence: Optional[int] = None
    ) -> List[EventMessage]:
        """Get all events for an analysis, optionally since a sequence number"""
        async with self._lock:
            events = list(self._queues.get(analysis_id, []))
            
            if since_sequence is not None:
                events = [
                    e for e in events 
                    if e.data.get('sequence', 0) > since_sequence
                ]
            
            return events
    
    async def register_listener(self, analysis_id: str) -> asyncio.Queue:
        """Register a new listener for real-time events"""
        async with self._lock:
            listener_queue = asyncio.Queue()
            self._listeners[analysis_id].append(listener_queue)
            logger.debug(f"Registered listener for analysis {analysis_id}")
            return listener_queue
    
    async def unregister_listener(self, analysis_id: str, listener_queue: asyncio.Queue):
        """Remove a listener"""
        async with self._lock:
            if analysis_id in self._listeners:
                try:
                    self._listeners[analysis_id].remove(listener_queue)
                    logger.debug(f"Unregistered listener for analysis {analysis_id}")
                except ValueError:
                    pass
    
    async def clear_events(self, analysis_id: str):
        """Clear all events for an analysis"""
        async with self._lock:
            if analysis_id in self._queues:
                self._queues[analysis_id].clear()
                self._sequence_numbers[analysis_id] = 0
            if analysis_id in self._listeners:
                del self._listeners[analysis_id]
            logger.debug(f"Cleared events for analysis {analysis_id}")
    
    def get_event_count(self, analysis_id: str) -> int:
        """Get the number of events for an analysis"""
        return len(self._queues.get(analysis_id, []))


# Global event queue instance
_event_queue: Optional[EventQueue] = None

def get_event_queue() -> EventQueue:
    """Get or create the global event queue instance"""
    global _event_queue
    if _event_queue is None:
        _event_queue = EventQueue()
    return _event_queue
