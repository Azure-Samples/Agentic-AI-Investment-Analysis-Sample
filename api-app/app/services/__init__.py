import importlib.metadata

from .analysis_service import AnalysisService
from .analysis_chat_service import AnalysisChatService
from .opportunity_service import OpportunityService
from .user_service import UserService
from .document_service import DocumentService
from .document_processing_service import DocumentProcessingService
from .workflow_events_service import WorkflowEventsService

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"  # Fallback for development mode

__all__ = [
            "AnalysisService",
            "AnalysisChatService",
            "OpportunityService",
            "UserService",
            "DocumentService",
            "DocumentProcessingService",
            "WorkflowEventsService",
          ]