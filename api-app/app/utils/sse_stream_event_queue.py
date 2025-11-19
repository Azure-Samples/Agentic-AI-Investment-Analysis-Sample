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

from app.models import StreamEventMessage

logger = logging.getLogger("app.utils.event_queue")


class SSEStreamEventQueue:
    """Manages sse stream event queues for workflows with persistence"""
    
    def __init__(self, max_events: int = 1000):
        # Store events per analysis_id
        self._queue: deque = deque(maxlen=max_events)
        # Track event sequence numbers
        self._sequence_number: int = 0
        # Track active listeners (for live streaming)
        self._listeners: List[asyncio.Queue] = []
        # Lock for thread safety
        self._lock = asyncio.Lock()
        
    async def add_event(
        self,
        event_msg: StreamEventMessage
    ) -> None:
        """Add an event to the queue for a specific analysis"""
        async with self._lock:
            if not isinstance(event_msg, StreamEventMessage):
                raise ValueError("event must be an instance of StreamEventMessage")

            if not event_msg.timestamp:
                event_msg.timestamp = datetime.now(timezone.utc).isoformat()
            
            # Add sequence number to event data
            seq = self._sequence_number
            event_msg.sequence = seq
            self._sequence_number += 1
            
            # Store event
            self._queue.append(event_msg)
            
            # Notify active listeners
            for listener_queue in self._listeners:
                try:
                    await listener_queue.put(event_msg)
                except Exception as e:
                    logger.error(f"Error notifying listener: {str(e)}")

            logger.debug(f"Added event: {event_msg.type} - {event_msg.executor}")
            
    async def get_events(
        self,
        since_sequence: Optional[int] = None
    ) -> List[StreamEventMessage]:
        """Get all events for an sse stream, optionally since a sequence number"""
        async with self._lock:
            events = list(self._queue)
            
            if since_sequence is not None:
                events = [
                    e for e in events 
                    if e.sequence > since_sequence
                ]
            
            return events
    
    async def register_listener(self) -> asyncio.Queue:
        """Register a new listener for real-time events"""
        async with self._lock:
            listener_queue = asyncio.Queue()
            self._listeners.append(listener_queue)
            logger.debug(f"Registered listener")
            return listener_queue
    
    async def unregister_listener(self, listener_queue: asyncio.Queue):
        """Remove a listener"""
        async with self._lock:
            try:
                self._listeners.remove(listener_queue)
                logger.debug(f"Unregistered listener")
            except ValueError:
                pass
    
    async def clear_event_queue(self):
        """Clear all events for an analysis"""
        async with self._lock:
            if self._queue:
                self._queue.clear()
                self._sequence_number = 0
            self._listeners.clear()
            logger.debug(f"Cleared events and listeners")
    
    def get_event_queue_count(self) -> int:
        """Get the number of events in the queue"""
        return len(self._queue)