import importlib.metadata

from .what_if_workflow import WhatIfChatWorkflow 

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"  # Fallback for development mode

__all__ = [
            "WhatIfChatWorkflow",
          ]