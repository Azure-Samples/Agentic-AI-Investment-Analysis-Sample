from dataclasses import dataclass
from typing import Never, Optional
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field

from agent_framework import AgentRunResponse, BaseChatClient, Executor, Workflow, WorkflowBuilder, WorkflowContext, handler, ChatAgent
from agent_framework.azure import AzureOpenAIChatClient

########################
# Data Models
# region Data Models
########################

@dataclass    
class AnalysisRunInput:
    """Typed container for the input to run an investment analysis."""
    hypothesis: str # investment hypothesis
    opportunity_id: str # associated opportunity ID
    analysis_id: str # unique analysis ID
    owner_id: str # user ID of the analysis owner
    company_name: str # name of the company being analyzed
    stage: str # investment stage
    industry: str # industry sector
    
    def to_dict(self) -> dict:
        return {
            "hypothesis": self.hypothesis,
            "opportunity_id": self.opportunity_id,
            "analysis_id": self.analysis_id,
            "owner_id": self.owner_id,
            "company_name": self.company_name,
            "stage": self.stage,
            "industry": self.industry
        }
    
@dataclass
class AnalysisData:
    """Typed container for the data used in the analysis workflow."""

    analysis_run_input: AnalysisRunInput
    document_summaries: dict[str, str] # listing of document IDs to summaries in markdown
    financial_summary: str
    market_summary: str
    risk_summary: str
    compliance_summary: str
    competitor_analysis: str
    external_data: dict[str, any]  # e.g., financials, market data
    
    def to_dict(self) -> dict:
        return {
            "analysis_run_input": self.analysis_run_input.to_dict() if self.analysis_run_input else None,
            "document_summaries": self.document_summaries,
            "financial_summary": self.financial_summary,
            "market_summary": self.market_summary,
            "risk_summary": self.risk_summary,
            "compliance_summary": self.compliance_summary,
            "competitor_analysis": self.competitor_analysis,
            "external_data": self.external_data
        }
    
@dataclass
class AnalystResult:
    """Typed container for the result from analysis executors."""
    analysis_run_input: AnalysisRunInput
    author_analyst_id: str
    analyst_result: 'AnalystResultResponseModel'
    
    def to_dict(self) -> dict:
        return {
            "analysis_run_input": self.analysis_run_input.to_dict() if self.analysis_run_input else None,
            "author_analyst_id": self.author_analyst_id,
            "analysis_result": self.analyst_result.model_dump() if self.analyst_result else None,
        }
    

class AnalystResultResponseModel(BaseModel):
    """Model representation for the analysis result response."""
    executive_summary: Optional[str] = Field(default=None, description="Executive summary of analysis")
    ai_agent_analysis: Optional[str] = Field(default=None, description="AI agent analysis")
    conclusions: Optional[str] = Field(default=None, description="Conclusions drawn from the analysis")
    sources: Optional[str] = Field(default=None, description="List of sources mentioned in the analysis")
    
    def to_dict(self) -> dict:
        return self.model_dump()

@dataclass
class AnalysisResult:
    """Typed container for the final analysis result."""
    analysis_run_input: AnalysisRunInput
    analyst_results: list[AnalystResult]
    challenger_output: Optional[str] = None
    supporter_output: Optional[str] = None
    summary_report: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "analysis_run_input": self.analysis_run_input.to_dict() if self.analysis_run_input else None,
            "analyst_results": [ar.to_dict() for ar in self.analyst_results],
            "challenger_output": self.challenger_output,
            "supporter_output": self.supporter_output,
            "summary_report": self.summary_report
        }