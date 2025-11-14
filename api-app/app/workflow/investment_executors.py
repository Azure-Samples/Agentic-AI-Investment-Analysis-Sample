import logging
from typing import Never, Optional
from abc import ABC, abstractmethod

from agent_framework import AgentRunEvent, AgentRunResponse, Executor, GroupChatBuilder, WorkflowContext, handler, ChatAgent
from agent_framework.azure import AzureOpenAIChatClient

from .investment_models import (
    AnalysisResult,
    AnalysisRunInput,
    AnalysisData,
    AnalystResult,
    AnalystResultResponseModel
)

logger = logging.getLogger("app.workflow.investment_executors")

########################
# region Data Preparation Executor
########################

class DataPreparationExecutor(Executor):
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "data_prepper"):
        self._chat_client = chat_client
        
        super().__init__(id=id)
        
    @handler
    async def handle(self, analysis_run_input: AnalysisRunInput, ctx: WorkflowContext[AnalysisData, AnalysisData]) -> None:
        """Receive hypothesis, fetches and prepares data for analysis
        
        Args:
            analysis_run_input (AnalysisRunInput): Investment hypothesis provided by the user
            ctx (WorkflowContext): Context for the workflow execution
        """

        logger.info(f"Preparing data for analysis. Hypothesis: {analysis_run_input.hypothesis}")
        analysis_data = self._prepare_data(analysis_run_input)
        
        await ctx.yield_output(analysis_data)
        
        # Forward the accumulated messages to the next executor in the workflow.
        await ctx.send_message(analysis_data)

    def _prepare_data(self, analysis_run_input: AnalysisRunInput) -> AnalysisData:
        logger.info("Preparing data for analysis")
        
        # 1. Fetch analysis-related document summaries from the database.
        # 2. Retrieve relevant external data (financial reports, market data, etc.).
        # 3. Clean and structure the data for analysis.
        analysis_data = AnalysisData(
            analysis_run_input=analysis_run_input,
            document_summaries={"doc1": "Summary of document 1"},
            financial_summary="Financial summary data",
            market_summary="Market summary data",
            risk_summary="Identified risk factors",
            compliance_summary="Compliance issues data",
            competitor_analysis="Competitor analysis data",
            external_data={"financials": {}, "market_data": {}}
        )

        return analysis_data

########################
# region Analyst Executors
########################

class BaseAnalyst(Executor, ABC):
    """Base class for different types of investment analysts (financial, risk, market, compliance)."""
    
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str, prompt_retriever: callable = None):
        self.chat_client = chat_client
        self._prompt_retriever_callable = prompt_retriever
        super().__init__(id=id)
        
    def create_agent(self, instructions: str) -> ChatAgent:
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id=self.id,
            name=self.id
        )
        return agent

    def format_prompt_template(self, analysis_input: AnalysisRunInput) -> str:
        if self._prompt_retriever_callable:
            prompt_template = self._prompt_retriever_callable(self.id)
            
            prompt_template = prompt_template.replace("{{company_name}}", analysis_input.company_name)
            prompt_template = prompt_template.replace("{{industry}}", analysis_input.industry)
            prompt_template = prompt_template.replace("{{stage}}", analysis_input.stage)
            
            return prompt_template
            
        return ""
    
    @abstractmethod
    def get_summary_data(self, analysis_data: AnalysisData) -> str:
        """Get the relevant summary data for this analyst type.
        
        Subclasses should override this method to return the appropriate summary field.
        
        Args:
            analysis_data (AnalysisData): The prepared analysis data
            
        Returns:
            str: The summary data relevant to this analyst
        """
        raise NotImplementedError("Subclasses must implement get_summary_data")
    
    @handler
    async def handle(self, analysis_data: AnalysisData, ctx: WorkflowContext[AnalystResult | None, AnalystResultResponseModel]) -> None:
        """Receive prepared data, perform analysis
        
        Args:
            analysis_data (AnalysisData): Prepared data from the previous step
            ctx (WorkflowContext): Context for the workflow execution
        """

        prompt_template = self.format_prompt_template(analysis_data.analysis_run_input)

        # Get the relevant summary data for this analyst type
        summary_data = self.get_summary_data(analysis_data)
        
        _agent_instructions = (
            f"### Company Name:\n{analysis_data.analysis_run_input.company_name}\n\n"
            f"### Document Consolidated Summary:\n{summary_data}\n\n"
            f"### INSTRUCTIONS ### \n\n{prompt_template}"
        )
        _agent = self.create_agent(instructions=_agent_instructions)
        _response: AgentRunResponse = await _agent.run(analysis_data.analysis_run_input.hypothesis, stream=False, response_format=AnalystResultResponseModel)

        analyst_response = AnalystResult(
            analysis_run_input=analysis_data.analysis_run_input,
            author_analyst_id=self.id,
            analyst_result=_response.value,
        )
        
        # Forward the accumulated messages to the next executor in the workflow.
        await ctx.send_message(analyst_response)
        
        # Output the analyst result to the workflow context
        # only output the analysis response, not the full analysis data
        await ctx.yield_output(analyst_response.analyst_result)


class FinancialAnalyst(BaseAnalyst):
    """Financial analyst specialized in analyzing financial data."""
    
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "financial_analyst", prompt_retriever: callable = None):
        super().__init__(chat_client=chat_client, id=id, prompt_retriever=prompt_retriever)
    
    def get_summary_data(self, analysis_data: AnalysisData) -> str:
        """Get the financial summary data for analysis."""
        return analysis_data.financial_summary


class RiskAnalyst(BaseAnalyst):
    """Risk analyst specialized in analyzing risk data."""
    
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "risk_analyst", prompt_retriever: callable = None):
        super().__init__(chat_client=chat_client, id=id, prompt_retriever=prompt_retriever)
    
    def get_summary_data(self, analysis_data: AnalysisData) -> str:
        """Get the risk summary data for analysis."""
        return analysis_data.risk_summary
        
        
class MarketAnalyst(BaseAnalyst):
    """Market analyst specialized in analyzing market data."""
    
    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "market_analyst", prompt_retriever: callable = None):
        super().__init__(chat_client=chat_client, id=id, prompt_retriever=prompt_retriever)
    
    def get_summary_data(self, analysis_data: AnalysisData) -> str:
        """Get the market summary data for analysis."""
        return analysis_data.market_summary


class ComplianceAnalyst(BaseAnalyst):
    """Compliance analyst specialized in analyzing compliance data."""

    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "compliance_analyst", prompt_retriever: callable = None):
        super().__init__(chat_client=chat_client, id=id, prompt_retriever=prompt_retriever)
    
    def get_summary_data(self, analysis_data: AnalysisData) -> str:
        """Get the compliance summary data for analysis."""
        return analysis_data.compliance_summary
        

class AnalysisAggregator(Executor):
    """Aggregates expert analyst responses into a single consolidated result (fan in)."""

    def __init__(self, expert_ids: list[str], id: str = "analysis_aggregator"):
        super().__init__(id=id)
        self._expert_ids = expert_ids

    @handler
    async def aggregate(self, results: list[AnalystResult], ctx: WorkflowContext[list[AnalystResult], Never]) -> None:
        """Aggregate responses from expert agents into a consolidated analysis."""
        
        await ctx.send_message(results)
        

########################
# region Debate Executors
########################

class InvestmentDebateWorkflowExecutor(Executor):
    """Conducts a debate between Supporter and Skeptic agents on the investment hypothesis."""

    GROUP_CHAT_MANAGER_INSTRUCTIONS = """You are coordinating a debate regarding the investment hypothesis and analyst responses provided.
        You facilitate a structured discussion between the Supporter and Challenger agents by selecting who speaks next,
        ensuring they address key points from the analysis.
        Encourage critical thinking and evidence-based arguments to thoroughly evaluate the investment opportunity.
        Have participants build on each other's contributions and challenge assumptions where necessary.
        Your goal is to help them reach a well-reasoned conclusion about the investment hypothesis.
        Only finish the debate when you believe both sides have sufficiently explored the topic."""
    

    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "investment_debate_executor", prompt_retriever: callable = None):
        self.chat_client = chat_client
        self._prompt_retriever_callable = prompt_retriever
        
        super().__init__(id=id)


    def create_agent(self, agent_id: str, aggregated_analysis: list[AnalystResult]) -> ChatAgent:
        _prompt = self._prompt_retriever_callable(agent_id) if self._prompt_retriever_callable else ""
                
        _agent_instructions = (
            f"### Aggregated Analysis Results:\n"
            + "\n\n".join(
                [
                    f"""#### Analyst ID: {result.author_analyst_id}\n
                    {result.analyst_result.executive_summary if isinstance(result.analyst_result.executive_summary, str) else ' '.join(result.analyst_result.executive_summary)}\n"
                    {result.analyst_result.ai_agent_analysis if isinstance(result.analyst_result.ai_agent_analysis, str) else ' '.join(result.analyst_result.ai_agent_analysis)}\n"
                    {result.analyst_result.conclusions if isinstance(result.analyst_result.conclusions, str) else ' '.join(result.analyst_result.conclusions)}\n"""
                for result in aggregated_analysis]
            )
            + "\n\n### INSTRUCTIONS ### \n\n"
            + _prompt
        )
        
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=_agent_instructions,
            description=(agent_id == "investment_supporter" and "An agent that supports the investment hypothesis." or "An agent that challenges the investment hypothesis."),
            id=agent_id,
            name=agent_id
        )
        return agent
    
    @handler
    async def handle(self, aggregated_analysis: list[AnalystResult], ctx: WorkflowContext[AnalysisResult, dict[str, any]]) -> None:
        """Provide additional support based on the analysis data.
        
        Args:
            aggregated_analysis (list[AnalysisResult]): Aggregated analysis results from the previous step
            ctx (WorkflowContext): Context for the workflow execution
        """

        # Build GroupChat Workflow of the supported and challenger agents
        supporter_agent = self.create_agent("investment_supporter", aggregated_analysis)
        challenger_agent = self.create_agent("investment_challenger", aggregated_analysis)
        
        workflow = (
            GroupChatBuilder()
            .set_prompt_based_manager(chat_client=self.chat_client, instructions=InvestmentDebateWorkflowExecutor.GROUP_CHAT_MANAGER_INSTRUCTIONS, display_name="Coordinator")
            .participants([supporter_agent, challenger_agent])
            .with_max_rounds(4)
            .build()
        )
       
        result = await workflow.run(
            message=aggregated_analysis[0].analysis_run_input.hypothesis
        )

        # extract the last AgentRunEvent for each agent to get their final output
        # result is a list of events, some of which are AgentRunEvent types
        # we need to filter and get the last message from each agent
        supporter_output = None
        challenger_output = None
        
        for event in reversed(result):
            if isinstance(event, AgentRunEvent):
                if event.executor_id.endswith("investment_supporter") and supporter_output is None:
                    supporter_output = str(event.data)
                elif event.executor_id.endswith("investment_challenger") and challenger_output is None:
                    challenger_output = str(event.data)
            if supporter_output and challenger_output:
                break
        
        final_analysis_result = AnalysisResult(
            analysis_run_input=aggregated_analysis[0].analysis_run_input,
            analyst_results=[AnalystResult(author_analyst_id=analyst_result.author_analyst_id, analyst_result=analyst_result.analyst_result, analysis_run_input=None) for analyst_result in aggregated_analysis], # clear the analysis_run_input to avoid redundancy
            challenger_output=challenger_output,
            supporter_output=supporter_output
        )
        
        # Forward the accumulated messages to the next executor in the workflow.
        await ctx.send_message(final_analysis_result)
        
        # Output the final analysis result to the workflow context
        await ctx.yield_output({
            "investment_supporter": supporter_output,
            "investment_challenger": challenger_output
        })

########################
# region Summary Report Generator
########################

class SummaryReportGenerator(Executor):
    """Generates a final summary report based on the debate outcome and analysis data."""

    def __init__(self, chat_client: AzureOpenAIChatClient, id: str = "summary_report_generator", prompt_retriever: callable = None):
        self.chat_client = chat_client
        self._prompt_retriever_callable = prompt_retriever
        
        super().__init__(id=id)

    def create_agent(self, analysisResult: AnalysisResult) -> ChatAgent:
        _prompt = self._prompt_retriever_callable(self.id) if self._prompt_retriever_callable else ""
                
        _agent_instructions = (
            f"### Investment Request Hypothesis:\n"
            + f"{analysisResult.analysis_run_input.hypothesis}\n\n"
            + f"### Investment Request Details:\n"
            + f"Company Name: {analysisResult.analysis_run_input.company_name}\n"
            + f"Industry: {analysisResult.analysis_run_input.industry}\n"
            + f"Stage: {analysisResult.analysis_run_input.stage}\n\n"
            + f"### Aggregated Analysis Results:\n"
            + "\n\n".join(
                [
                    f"""#### Analyst ID: {result.author_analyst_id}\n
                    {result.analyst_result.executive_summary if isinstance(result.analyst_result.executive_summary, str) else ' '.join(result.analyst_result.executive_summary)}\n"
                    {result.analyst_result.ai_agent_analysis if isinstance(result.analyst_result.ai_agent_analysis, str) else ' '.join(result.analyst_result.ai_agent_analysis)}\n"
                    {result.analyst_result.conclusions if isinstance(result.analyst_result.conclusions, str) else ' '.join(result.analyst_result.conclusions)}\n"""
                for result in analysisResult.analyst_results]
            )
            + "\n\n### Investment Debate Summary:\n"
            + f"**Supporter Output:**\n{analysisResult.supporter_output}\n\n"
            + f"**Challenger Output:**\n{analysisResult.challenger_output}"
            + "\n\n\n### INSTRUCTIONS ### \n\n"
            + _prompt
        )
        
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=_agent_instructions,
            id=self.id,
            name=self.id
        )
        return agent
    
    @handler
    async def handle(self, analysisResult: AnalysisResult, ctx: WorkflowContext[Never, dict[str, any]]) -> None:
        """Finalize the analysis with a summary report.
        
        Args:
            analysisResult (AnalysisResult): Aggregated analysis results from the previous step
            ctx (WorkflowContext): Context for the workflow execution
        """
        _agent = self.create_agent(analysisResult=analysisResult)
        _response = await _agent.run(analysisResult.analysis_run_input.hypothesis, stream=False)

        # logger.debug(f"{self.id} agent run completed. Response: {_response.to_dict()}")

        _response_text = "\n".join([m.text for m in _response.messages])

        # Update the analysisResult with the summary report
        analysisResult.summary_report = _response_text

        # Output the final analysis result to the workflow context
        await ctx.yield_output({f"{self.id}": analysisResult.summary_report})