
from abc import ABC, abstractmethod
from typing import Any

from agent_framework import WorkflowOutputEvent


class WorkflowEventAdapter(ABC):
    """Abstract base class for workflow event adapters"""
    
    @abstractmethod
    def handle_event(self, event) -> Any:
        """Handle incoming event and convert to desired format"""
        pass



class WorkflowEventToStreamEventMessageAdapter(WorkflowEventAdapter):
    """Adapter for workflow events to StreamEventMessage format"""
    
    def __init__(self):
        pass
    