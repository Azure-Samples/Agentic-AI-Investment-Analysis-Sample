from dataclasses import dataclass
import logging

from collections.abc import Collection
from typing import Any, Never
import uuid

from agent_framework import AgentRunResponse, AgentRunResponseUpdate, AgentThread, ChatMessage, ChatMessageStoreProtocol, Executor, WorkflowContext, handler
from agent_framework._threads import ChatMessageStoreState
from agent_framework import BaseChatClient, ChatAgent, Workflow, WorkflowBuilder

from app.database.repositories import WhatIfMessageRepository
from app.models import WhatIfMessage, Analysis

from .what_if_models import AnalystAgentOutput, ConversationContext, PlanningAgentStepResponseModel, PlanningAgentResponseModel, ExecutionPlan, WhatIfChatWorkflowInputData

logger = logging.getLogger("app.what_if_chat.chat_workflow")

# region Conversation History Retriever

class ConversationHistoryRetriever(Executor):
    """Retrieves conversation history for a given conversation ID."""
    
    def __init__(self, conversation_store: WhatIfMessageRepository = None, id: str = "conversation_history_retriever"):
        self.conversation_store = conversation_store
        
        super().__init__(id=id)
    
    @handler
    async def handle(self, input: WhatIfChatWorkflowInputData, ctx: WorkflowContext[WhatIfChatWorkflowInputData, None]) -> Any:
        logger.info("ConversationHistoryRetriever: Starting execution")
        
        # Retrieve conversation history
        if self.conversation_store:
            history_messages: Collection[WhatIfMessage] = await self.conversation_store.get_messages_by_conversation(input.conversation_id)
            
            logger.debug(f"ConversationHistoryRetriever: Retrieved {len(history_messages)} messages from history")
            
            if history_messages and len(history_messages) > 0:
                history_messages = sorted(history_messages, key=lambda msg: msg.sequence_number)
                ctx.set_shared_state(key="conversation_context", state=ConversationContext(
                    conversation_id=input.conversation_id,
                    message_history=[ChatMessage(role=msg.role, text=msg.text, author_name=msg.author) for msg in history_messages]
                ))
        
        await ctx.send_message(input)
        
        logger.info("ConversationHistoryRetriever: Execution completed")

# end region

######################################
# region Planning Agent

class PlanningAgentExecutor(Executor):
    
    def __init__(self, chat_client: BaseChatClient, id: str = "planning_agent_executor"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
    
    async def create_agent(self, id: str, instructions: str) -> ChatAgent:
        """Create and return a ChatAgent configured for the What-If Chat workflow"""
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id=id,
            name=id
        )
        return agent
    
    async def try_save_shared_context(self, ctx: WorkflowContext[Any, Any], conversation_context: ConversationContext) -> None:
        """Save conversation context to shared state"""
        
        if conversation_context is None or conversation_context.message_history is None or len(conversation_context.message_history) == 0:
            return
        
        await ctx.set_shared_state(key="conversation_context", value=conversation_context)
    
    async def create_thread_from_context(self, agent: ChatAgent, conversation_context: ConversationContext) -> AgentThread:
        """Create an AgentThread from the workflow context"""
        thread = agent.get_new_thread()
        if conversation_context is not None and conversation_context.message_history is not None:
            for msg in conversation_context.message_history:
                await thread.on_new_messages(msg)
        return thread
    
    @handler
    async def handle(self, input: WhatIfChatWorkflowInputData, ctx: WorkflowContext[ExecutionPlan, PlanningAgentResponseModel]) -> Any:
        logger.info("PlanningAgentExecutor: Starting execution")
        
        # Save conversation context to shared state
        await self.try_save_shared_context(ctx, input.conversation_context)
        
        _agent = await self.create_agent(
            id="planning_agent",
            instructions="""# ROLE: You are a planning agent responsible for orchestrating the What-If Chat analysis.
                            
                            # TASK:
                            Your task is to break down the user's input into a series of steps that will guide the other specialized agents in the workflow.
                            
                            # GUIDELINES:
                            - The **user's input may be addressing or tagging a specific agent by name or role** like this: "Financial Analyst" or "@Financial Analyst", "finance-agent", "@finance-agent", etc.. your planned steps MUST then target these **addressed agents** ONLY. 
                            - If the user did not address any particular agent, consider involving multiple agents as needed.
                            - Each step should be clear and concise, outlining what needs to be done and which agent is responsible for that step.
                            - Ensure that the steps are logically ordered to facilitate a coherent analysis process.
                            - Each agent should have a specific role in the analysis, and steps should leverage their expertise accordingly.
                            - There should be at maximum of 5 steps in the plan with one agent assigned per step.
                            - If the user's input is vague or lacks detail, create steps that include gathering additional information as necessary.
                            - If the user's input is irrelevant or off-topic, then don't create any steps and respond with a message politely asking the user to stay on topic.
                            
                            ## SPECIALIZED AGENTS: 
                            The agents available to you are:
                            1. Financial Analyst Agent - id=financial_analyst_agent: Focuses on financial metrics, market conditions, and investment recommendations.
                            2. Risk Analyst Agent - id=risk_analyst_agent: Evaluates potential risks associated with investment scenarios, including market, credit, operational, and liquidity risks.
                            3. Market Analyst Agent - id=market_analyst_agent: Analyzes market trends, economic indicators, and external factors affecting investments.
                            4. Compliance Analyst Agent - id=compliance_analyst_agent: Ensures that investment strategies comply with relevant regulations and industry standards.
                            
                            Each step in your plan should specify which agent is responsible for executing that part of the analysis.
                            Always use the agent IDs provided above when assigning steps to agents.
                            
                            # PREVIOUS CONTEXT:
                            The chat might include previous messages for context from the user and other agents as part of a conversation.
                            
                            # OUTPUT FORMAT:
                            Analyze the input messages and create a structured plan in JSON format.
                            Respond in the following JSON format only:
                            {
                                "name": "<Name of the analysis>",
                                "description": "<Brief description of the analysis>",
                                "message": "<A summary message to the user about the plan or ask clarification if needed>",
                                "steps": [
                                    {
                                        "number": <Step number>,
                                        "task": "<Description of the step task to be performed>",
                                        "assigned_agent": "<Agent responsible for this step>"
                                    },
                                    ...
                                ]
                            }
            """
        )
                
        _thread = await self.create_thread_from_context(_agent, input.conversation_context)
                
        _response: AgentRunResponse = await _agent.run(input.input_messages, thread=_thread, response_format=PlanningAgentResponseModel)
        
        await ctx.yield_output(_response.value)
        
        _output = ExecutionPlan(
            agent_id=_agent.id,
            analysis=input.analysis,
            input_messages=input.input_messages,
            plan=_response.value
        )
        
        await ctx.send_message(_output)
        
        logger.info("PlanningAgentExecutor: Execution completed")
        
# end region

######################################
# region Financial Agent

class FinancialAgentExecutor(Executor):
    def __init__(self, chat_client: BaseChatClient, id: str = "financial_analyst_agent_executor"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
    
    async def create_agent(self, id: str, instructions: str) -> ChatAgent:
        """Create and return a ChatAgent configured for the What-If Chat workflow"""
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id=id,
            name=id
        )
        return agent
    
    async def create_thread_from_context(self, agent: ChatAgent, ctx: WorkflowContext[Any, Any]) -> AgentThread:
        """Create an AgentThread from the workflow context"""
        thread = agent.get_new_thread()
        if not await ctx.shared_state.has("conversation_context"):
            return thread
        
        conversation_context: ConversationContext = await ctx.get_shared_state(key="conversation_context")
        if conversation_context is not None and conversation_context.message_history is not None:
            for msg in conversation_context.message_history:
                await thread.on_new_messages(msg)
        return thread
    
    @handler
    async def handle(self, input: ExecutionPlan, ctx: WorkflowContext[AnalystAgentOutput, str]) -> Any:
        logger.info("FinancialAgentExecutor: Starting execution")
        
        # check to see if this agent is addressed in the plan steps
        addressed_in_steps: list[PlanningAgentStepResponseModel] = []
        for step in input.plan.steps:
            if step.assigned_agent.lower() in ["financial analyst agent", "financial_analyst_agent", "finance-agent", "finance agent"]:
                addressed_in_steps.append(step)
        
        logger.debug(f"FinancialAgentExecutor: Addressed in steps: {addressed_in_steps}")
        
        for step in addressed_in_steps:
            logger.info(f"FinancialAgentExecutor: Executing step {step.number}: {step.task}")
            
            _agent = await self.create_agent(
                id="financial_analyst_agent",
                instructions="""You are a financial analyst agent. Your role is to analyze investment scenarios based on user input and provide insights, recommendations, and risk assessments. 
                                Use your expertise in finance to evaluate the information provided and respond with well-reasoned analysis.
                                When responding, consider various financial metrics, market conditions, and potential risks associated with the investment scenarios presented.
                                Provide your analysis in a clear and concise manner, suitable for users who may not have a deep financial background.
                                Focus on delivering actionable insights that can help users make informed investment decisions.
                                Respond in a detailed manner, using examples and data where appropriate to support your analysis.
                                Respond only with text relevant to financial analysis and avoid deviating into unrelated topics.
                                The chat might include previous messages for context from the user and other agents as part of a conversation.
                                Your response should be in markdown format for better readability.
                """
            )
            
            _thread = await self.create_thread_from_context(_agent, ctx)
            
            # _all_response_updates: list[AgentRunResponseUpdate] = []
            # async for event in _agent.run_stream(messages=step.task, thread=_thread):
            #     if isinstance(event, AgentRunResponseUpdate):
            #         _response_delta = event.text
            #         _all_response_updates.append(event)
            #         await ctx.yield_output(_response_delta)
                    
            # _response: AgentRunResponse = AgentRunResponse.from_agent_run_response_updates(_all_response_updates)
            
            _response: AgentRunResponse = await _agent.run(messages=step.task, thread=_thread)
            
            await ctx.yield_output(_response.text)
            
            await ctx.send_message(AnalystAgentOutput(
                agent_id=self.id,
                response=_response
            ))
        
        logger.info("FinancialAgentExecutor: Execution completed")

# end region

######################################
# region Risk Agent

class RiskAgentExecutor(Executor):
    def __init__(self, chat_client: BaseChatClient, id: str = "risk_analyst_agent_executor"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
    
    async def create_agent(self, id: str, instructions: str) -> ChatAgent:
        """Create and return a ChatAgent configured for the What-If Chat workflow"""
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id=id,
            name=id
        )
        return agent
    
    async def create_thread_from_context(self, agent: ChatAgent, ctx: WorkflowContext[Any, Any]) -> AgentThread:
        """Create an AgentThread from the workflow context"""
        thread = agent.get_new_thread()
        if not await ctx.shared_state.has("conversation_context"):
            return thread
        
        conversation_context: ConversationContext = await ctx.get_shared_state(key="conversation_context")
        if conversation_context is not None and conversation_context.message_history is not None:
            for msg in conversation_context.message_history:
                await thread.on_new_messages(msg)
        return thread
    
    @handler
    async def handle(self, input: ExecutionPlan, ctx: WorkflowContext[AnalystAgentOutput, str]) -> Any:
        logger.info("RiskAgentExecutor: Starting execution")
        
        # check to see if this agent is addressed in the plan steps
        addressed_in_steps: list[PlanningAgentStepResponseModel] = []
        for step in input.plan.steps:
            if step.assigned_agent.lower() in ["risk analyst agent", "risk_analyst_agent", "risk-agent", "risk agent"]:
                addressed_in_steps.append(step)
        
        for step in addressed_in_steps:
            logger.info(f"RiskAgentExecutor: Executing step {step.number}: {step.task}")
        
            _agent = await self.create_agent(
                id="risk_analyst_agent",
                instructions="""You are a risk analyst agent. Your role is to evaluate investment scenarios and identify potential risks associated with them. 
                                Use your expertise in risk management to assess the information provided and respond with a comprehensive risk analysis.
                                When responding, consider various types of risks including market risk, credit risk, operational risk, and liquidity risk.
                                Provide your analysis in a clear and concise manner, suitable for users who may not have a deep financial background.
                                Focus on delivering actionable insights that can help users understand and mitigate potential risks in their investment decisions.
                                Respond in a detailed manner, using examples and data where appropriate to support your analysis.
                                Respond only with text relevant to risk analysis and avoid deviating into unrelated topics.
                                The chat might include previous messages for context from the user and other agents as part of a conversation.
                                Your response should be in markdown format for better readability.
                """
            )
            
            _thread = await self.create_thread_from_context(_agent, ctx)
            _response: AgentRunResponse = await _agent.run(messages=step.task, thread=_thread)
            
            await ctx.yield_output(_response.text)
            
            await ctx.send_message(AnalystAgentOutput(agent_id=self.id, 
                                                      response=_response)
            )
        
        logger.info("RiskAgentExecutor: Execution completed")

# end region

######################################
# region Market Agent

class MarketAgentExecutor(Executor):
    def __init__(self, chat_client: BaseChatClient, id: str = "market_analyst_agent_executor"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
    
    async def create_agent(self, id: str, instructions: str) -> ChatAgent:
        """Create and return a ChatAgent configured for the What-If Chat workflow"""
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id=id,
            name=id
        )
        return agent
    
    async def create_thread_from_context(self, agent: ChatAgent, ctx: WorkflowContext[Any, Any]) -> AgentThread:
        """Create an AgentThread from the workflow context"""
        thread = agent.get_new_thread()
        if not await ctx.shared_state.has("conversation_context"):
            return thread
        
        conversation_context: ConversationContext = await ctx.get_shared_state(key="conversation_context")
        if conversation_context is not None and conversation_context.message_history is not None:
            for msg in conversation_context.message_history:
                await thread.on_new_messages(msg)
        return thread
    
    @handler
    async def handle(self, input: ExecutionPlan, ctx: WorkflowContext[AnalystAgentOutput, str]) -> Any:
        logger.info("MarketAgentExecutor: Starting execution")
        
        # check to see if this agent is addressed in the plan steps
        addressed_in_steps: list[PlanningAgentStepResponseModel] = []
        for step in input.plan.steps:
            if step.assigned_agent.lower() in ["market analyst agent", "market_analyst_agent", "market-agent", "market agent"]:
                addressed_in_steps.append(step)
        
        for step in addressed_in_steps:
            logger.info(f"MarketAgentExecutor: Executing step {step.number}: {step.task}")
        
            _agent = await self.create_agent(
                id="market_analyst_agent",
                instructions="""You are a market analyst agent. Your role is to evaluate investment scenarios and identify potential market impacts associated with them. 
                                Use your expertise in market analysis to assess the information provided and respond with a comprehensive market analysis.
                                When responding, consider various types of risks including market risk, credit risk, operational risk, and liquidity risk.
                                Provide your analysis in a clear and concise manner, suitable for users who may not have a deep financial background.
                                Focus on delivering actionable insights that can help users understand and mitigate potential risks in their investment decisions.
                                Respond in a detailed manner, using examples and data where appropriate to support your analysis.
                                Respond only with text relevant to risk analysis and avoid deviating into unrelated topics.
                                The chat might include previous messages for context from the user and other agents as part of a conversation.
                                Your response should be in markdown format for better readability.
                """
            )
            
            _thread = await self.create_thread_from_context(_agent, ctx)
            _response: AgentRunResponse = await _agent.run(messages=step.task, thread=_thread)
            
            await ctx.yield_output(_response.text)
            
            await ctx.send_message(AnalystAgentOutput(agent_id=self.id, response=_response))
        
        logger.info("MarketAgentExecutor: Execution completed")
# end region

######################################
# region Compliance Agent

class ComplianceAgentExecutor(Executor):
    def __init__(self, chat_client: BaseChatClient, id: str = "compliance_analyst_agent_executor"):
        self.chat_client = chat_client
        
        super().__init__(id=id)
    
    async def create_agent(self, id: str, instructions: str) -> ChatAgent:
        """Create and return a ChatAgent configured for the What-If Chat workflow"""
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id=id,
            name=id
        )
        return agent
    
    async def create_thread_from_context(self, agent: ChatAgent, ctx: WorkflowContext[Any, Any]) -> AgentThread:
        """Create an AgentThread from the workflow context"""
        thread = agent.get_new_thread()
        if not await ctx.shared_state.has("conversation_context"):
            return thread
        
        conversation_context: ConversationContext = await ctx.get_shared_state(key="conversation_context")
        if conversation_context is not None and conversation_context.message_history is not None:
            for msg in conversation_context.message_history:
                await thread.on_new_messages(msg)
        return thread
    
    @handler
    async def handle(self, input: ExecutionPlan, ctx: WorkflowContext[AnalystAgentOutput, str]) -> Any:
        logger.info("ComplianceAgentExecutor: Starting execution")
        
        # check to see if this agent is addressed in the plan steps
        addressed_in_steps: list[PlanningAgentStepResponseModel] = []
        for step in input.plan.steps:
            if step.assigned_agent.lower() in ["compliance analyst agent", "compliance_analyst_agent", "compliance-agent", "compliance agent"]:
                addressed_in_steps.append(step)
        
        for step in addressed_in_steps:
            logger.info(f"ComplianceAgentExecutor: Executing step {step.number}: {step.task}")
        
            _agent = await self.create_agent(
                id="compliance_analyst_agent",
                instructions="""You are a compliance analyst agent. Your role is to evaluate investment scenarios and identify potential compliance impacts associated with them. 
                                Use your expertise in compliance analysis to assess the information provided and respond with a comprehensive compliance analysis.
                                When responding, consider various types of risks including market risk, credit risk, operational risk, and liquidity risk.
                                Provide your analysis in a clear and concise manner, suitable for users who may not have a deep financial background.
                                Focus on delivering actionable insights that can help users understand and mitigate potential risks in their investment decisions.
                                Respond in a detailed manner, using examples and data where appropriate to support your analysis.
                                Respond only with text relevant to risk analysis and avoid deviating into unrelated topics.
                                The chat might include previous messages for context from the user and other agents as part of a conversation.
                                Your response should be in markdown format for better readability.
                """
            )
            
            _thread = await self.create_thread_from_context(_agent, ctx)
            _response: AgentRunResponse = await _agent.run(messages=step.task, thread=_thread)
            
            await ctx.yield_output(_response.text)
            
            await ctx.send_message(AnalystAgentOutput(agent_id=self.id, response=_response))
        
        logger.info("ComplianceAgentExecutor: Execution completed")
# end region

######################################
# region Summarizer Agent

class AnalysisSummarizer(Executor):
    """Aggregates expert analyst responses into a single consolidated result (fan in)."""

    def __init__(self, expert_ids: list[str], chat_client: BaseChatClient, id: str = "analysis_summarizer"):
        super().__init__(id=id)
        self._expert_ids = expert_ids
        self.chat_client = chat_client

    async def create_agent(self, id: str, instructions: str) -> ChatAgent:
        """Create and return a ChatAgent configured for the What-If Chat workflow"""
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id=id,
            name=id
        )
        return agent

    @handler
    async def aggregate(self, analyst_outputs: list[AnalystAgentOutput], ctx: WorkflowContext[Never, str]) -> None:
        """Aggregate responses from expert agents into a consolidated analysis."""
        
        logger.info("SummarizerAgentExecutor: Starting execution")
        
        _agent = await self.create_agent(
            id="summarizer_agent",
            instructions="""You are an analysis summarizer agent. Your role is to consolidate the responses from multiple expert analyst agents into a single, coherent summary. 
                            Use your expertise in summarization to review the information provided by the expert agents and respond with a comprehensive summary.
                            When responding, ensure that you capture the key insights, recommendations, and risk assessments provided by each expert agent.
                            Provide your summary in a clear and concise manner, suitable for users who may not have a deep financial background.
                            Focus on delivering actionable insights that can help users make informed investment decisions.
                            Respond in a detailed manner, using examples and data where appropriate to support your summary.
                            Include tables or bullet points to enhance readability where necessary.
                            Include references to the contributions of each expert agent by their names or roles.
                            Respond only with text relevant to the analysis summary and avoid deviating into unrelated topics.
                            The chat might include previous messages for context from the user and other agents as part of a conversation.
                            Your response should be in markdown format for better readability.
            """
        )
        
        # Combine the analysis results into a single input for the summarizer agent
        # Map each AgentRunResponse to its text content
        
        logger.debug(f"SummarizerAgentExecutor: Input analyst results: {analyst_outputs}")
        
        agent_responses = [f"{result.agent_id}: {result.response.text}" for result in analyst_outputs]
        combined_analysis = "\n\n".join(agent_responses)
        
        _response: AgentRunResponse = await _agent.run(combined_analysis)
        
        await ctx.yield_output(_response.text)
       
        logger.info("SummarizerAgentExecutor: Execution completed")