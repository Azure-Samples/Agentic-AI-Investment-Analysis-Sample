import logging
from dataclasses import dataclass

from agent_framework import Executor, WorkflowContext, handler
from agent_framework.azure import AzureOpenAIChatClient


from app.utils.credential import get_azure_credential

logger = logging.getLogger("app.workflow.investment_workflow")

class InvestmentAnalysisWorkflow:
    
    def __init__(self, analysis_id: str):
        self.analysis_id = analysis_id

        self.chat_client = AzureOpenAIChatClient(credential=get_azure_credential())
        
    def initialize_workflow(self):
        logger.info(f"Initializing investment analysis workflow for analysis {self.analysis_id}")
        # Initialization logic here
        
        
    def _setup_data_prep_executor(self):
        logger.info(f"Setting up data preparation executor for analysis {self.analysis_id}")
        # Setup logic here
        self.data_prep_executor = DataPreparationExecutor(chat_client=self.chat_client)
        

@dataclass
class AnalysisData:
    """Typed container for the data used in the analysis workflow."""

    hypothesis: str
    document_summaries: dict[str, str] # listing of document IDs to summaries in markdown
    financial_summary: str
    market_summary: str
    risk_factors: str
    compliance_issues: str
    competitor_analysis: str
    external_data: dict[str, any]  # e.g., financials, market data
    

class DataPreparationExecutor(Executor):
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "data_prepper"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
        
    @handler
    async def handle(self, input_hypothesis: str, ctx: WorkflowContext[AnalysisData]) -> None:
        """Receive hypothesis, fetches and prepares data for analysis
        
        Args:
            input_hypothesis (str): Investment hypothesis provided by the user
            ctx (WorkflowContext): Context for the workflow execution
        """
        
        # Forward the accumulated messages to the next executor in the workflow.
        await ctx.send_message({"data_prepared": True})
                
    def _prepare_data(self):
        logger.info("Preparing data for analysis")
        
        # 1. Fetch analysis-related document summaries from the database.
        # 2. Retrieve relevant external data (financial reports, market data, etc.).
        # 3. Clean and structure the data for analysis.
        analysis_data = AnalysisData(
            hypothesis="Sample Hypothesis",
            document_summaries={"doc1": "Summary of document 1"},
            financial_summary="Financial summary data",
            market_summary="Market summary data",
            risk_factors="Identified risk factors",
            compliance_issues="Compliance issues data",
            competitor_analysis="Competitor analysis data",
            external_data={"financials": {}, "market_data": {}}
        )

        return analysis_data


class FinancialAnalyst(Executor):
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "financial_analyst"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
        
    @handler
    async def handle(self, prepped_data: dict[str, any], ctx: WorkflowContext[dict[str, any], str]) -> None:
        """Receive hypothesis, fetch and prepare data for analysis
        
        Args:
            prepped_data (dict[str, any]): Prepared data from the previous step
            ctx (WorkflowContext): Context for the workflow execution
        """

        
        # Forward the accumulated messages to the next executor in the workflow.
        await ctx.send_message({"data_prepared": True})


class RiskAnalyst(Executor):
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "risk_analyst"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
        
        
    @handler
    async def handle(self, prepped_data: dict[str, any], ctx: WorkflowContext[dict[str, any], str]) -> None:
        """Receive prepared data, perform risk analysis
        
        Args:
            prepped_data (dict[str, any]): Prepared data from the previous step
            ctx (WorkflowContext): Context for the workflow execution
        """

        
        # Forward the accumulated messages to the next executor in the workflow.
        await ctx.send_message({"data_prepared": True})