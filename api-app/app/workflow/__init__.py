import importlib.metadata

from .investment_models import AnalysisRunInput
from .investment_workflow import InvestmentAnalysisWorkflow 

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"  # Fallback for development mode

__all__ = [
            "InvestmentAnalysisWorkflow",
            "AnalysisRunInput",
          ]