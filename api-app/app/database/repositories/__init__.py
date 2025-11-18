import importlib.metadata

from ._base import BaseRepository
from ._user import UserRepository
from ._document import DocumentRepository
from ._opportunity import OpportunityRepository
from ._analysis import AnalysisRepository
from ._analysis_workflow_event import AnalysisWorkflowEventRepository

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"  # Fallback for development mode

__all__ = [
            "BaseRepository", 
            "UserRepository",
            "DocumentRepository",
            "OpportunityRepository",
            "AnalysisRepository",
            "AnalysisWorkflowEventRepository"
           ]