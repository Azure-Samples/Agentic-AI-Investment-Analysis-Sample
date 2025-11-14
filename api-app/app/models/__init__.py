import importlib.metadata

from ._base import CosmosBaseModel
from ._user import User
from ._document import Document
from ._analysis import Analysis
from ._opportunity import Opportunity
from ._analysis_workflow_event import AnalysisWorkflowEvent
from ._stream_event_message import StreamEventMessage
try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"  # Fallback for development mode

__all__ = [
            "CosmosBaseModel", 
            "User",
            "Document",
            "Analysis",
            "Opportunity",
            "AnalysisWorkflowEvent",
            "StreamEventMessage",
          ]