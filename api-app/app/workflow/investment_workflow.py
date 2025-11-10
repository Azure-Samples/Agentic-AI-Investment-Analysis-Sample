import logging

from agent_framework import BaseChatClient, Workflow, WorkflowBuilder

from app.dependencies import get_chat_client
from .investment_models import AnalysisRunInput
from .investment_executors import (
    DataPreparationExecutor,
    FinancialAnalyst,
    RiskAnalyst,
    MarketAnalyst,
    ComplianceAnalyst,
    AnalysisAggregator,
    InvestmentDebateWorkflowExecutor,
    SummaryReportGenerator
)


logger = logging.getLogger("app.workflow.investment_workflow")

class InvestmentAnalysisWorkflow:
    
    def __init__(self, chat_client: BaseChatClient):
        self.chat_client = chat_client
        self.analysis_id = None  # Will be set when running workflow

        self.data_prep_executor: DataPreparationExecutor | None = None
        self.financial_analyst: FinancialAnalyst | None = None
        self.risk_analyst: RiskAnalyst | None = None
        self.market_analyst: MarketAnalyst | None = None
        self.compliance_analyst: ComplianceAnalyst | None = None
        
        self.analysis_aggregator: AnalysisAggregator | None = None

        self.debate_executor: InvestmentDebateWorkflowExecutor | None = None

        # Agent Framework workflow
        self.workflow : Workflow | None = None
        
    async def initialize_workflow(self):
        logger.info(f"Initializing investment analysis workflow")
        # Initialization logic here
        
        self.data_prep_executor = DataPreparationExecutor(chat_client=self.chat_client)
        self.financial_analyst = FinancialAnalyst(chat_client=self.chat_client, prompt_retriever=self.get_prompt_template)
        self.risk_analyst = RiskAnalyst(chat_client=self.chat_client, prompt_retriever=self.get_prompt_template)
        self.market_analyst = MarketAnalyst(chat_client=self.chat_client, prompt_retriever=self.get_prompt_template)
        self.compliance_analyst = ComplianceAnalyst(chat_client=self.chat_client, prompt_retriever=self.get_prompt_template)
        self.analysis_aggregator = AnalysisAggregator(expert_ids=[self.financial_analyst.id, self.risk_analyst.id, self.market_analyst.id, self.compliance_analyst.id])
        self.debate_executor = InvestmentDebateWorkflowExecutor(chat_client=self.chat_client, prompt_retriever=self.get_prompt_template)
        self.summary_report_generator = SummaryReportGenerator(chat_client=self.chat_client, prompt_retriever=self.get_prompt_template)
        
        self.workflow  = (
            WorkflowBuilder()
            .set_start_executor(self.data_prep_executor)
            .add_fan_out_edges(self.data_prep_executor, [self.financial_analyst, self.risk_analyst, self.market_analyst, self.compliance_analyst])
            .add_fan_in_edges([self.financial_analyst, self.risk_analyst, self.market_analyst, self.compliance_analyst], self.analysis_aggregator)
            .add_edge(self.analysis_aggregator, self.debate_executor)
            .add_edge(self.debate_executor, self.summary_report_generator)
            .build()
    )
    
    async def run_workflow_stream(self, analysis_run_input: 'AnalysisRunInput'):
        if not self.workflow:
            raise Exception("Workflow not initialized. Call initialize_workflow() first.")

        logger.info(f"Running investment analysis workflow for analysis {analysis_run_input.analysis_id}")

        async for event in self.workflow.run_stream(analysis_run_input):
            yield event

        logger.info(f"Workflow run completed for analysis {analysis_run_input.analysis_id}")

    
    def get_prompt_template(self, agent_id: str) -> str:
        logger.info(f"Getting prompt template for agent type: {agent_id}")
        # Return prompt template based on agent type
        
        # fetch from the file system
        current_path = __file__.rsplit('/', 1)[0]
        prompt_file_path = f"{current_path}/prompts/{agent_id}.md"
        try:
            with open(prompt_file_path, 'r') as file:
                prompt_template = file.read()
                logger.debug(f"Prompt template loaded from {prompt_file_path}")
                return prompt_template
        except FileNotFoundError:
            logger.error(f"Prompt template file not found: {prompt_file_path}")
            return ""
        except Exception as e:
            logger.error(f"Error loading prompt template from {prompt_file_path}: {e}")
            return ""
    
