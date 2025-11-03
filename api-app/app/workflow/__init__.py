import importlib.metadata

from .event_queue import EventQueue, WorkflowEvent, get_event_queue
from .workflow_executor import WorkflowExecutor

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"  # Fallback for development mode

__all__ = [
            "EventQueue", "WorkflowEvent", "get_event_queue",
            "WorflowExecutor",
          ]