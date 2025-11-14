import importlib.metadata

from .analysis_service import AnalysisService
from .opportunity_service import OpportunityService
from .user_service import UserService
from .document_service import DocumentService
from .document_processing_service import DocumentProcessingService
from .analysis_workflow_events_service import AnalysisWorkflowEventsService
from .analysis_workflow_executor_service import AnalysisWorkflowExecutorService
from .whatif_workflow_executor_service import WhatIfWorkflowExecutorService

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"  # Fallback for development mode

__all__ = [
            "AnalysisService",
            "OpportunityService",
            "UserService",
            "DocumentService",
            "DocumentProcessingService",
            "AnalysisWorkflowEventsService",
            "AnalysisWorkflowExecutorService",
            "WhatIfWorkflowExecutorService"
          ]