from dataclasses import dataclass
import logging

from collections.abc import Collection
from typing import Any
import uuid

from agent_framework import AgentThread, ChatMessage, ChatMessageStoreProtocol
from agent_framework._threads import ChatMessageStoreState
from agent_framework import BaseChatClient, ChatAgent, Workflow, WorkflowBuilder

from app.database.repositories import WhatIfMessageRepository
from app.models import Analysis

from .what_if_models import WhatIfChatWorkflowInputData
from .what_if_executors import (ConversationHistoryRetriever, PlanningAgentExecutor, 
                                FinancialAgentExecutor, 
                                RiskAgentExecutor, 
                                MarketAgentExecutor,
                                ComplianceAgentExecutor,
                                AnalysisSummarizer)

logger = logging.getLogger("app.what_if_chat.chat_workflow")


class WhatIfChatWorkflow:
    
    def __init__(self, chat_client: BaseChatClient):
        self.chat_client = chat_client
        self.workflow : Workflow | None = None
        
    async def initialize_workflow(self):
        logger.info(f"Initializing What-If Chat workflow")
        # Initialization logic here

        planner_agent = PlanningAgentExecutor(chat_client=self.chat_client)
        financial_analyst_agent = FinancialAgentExecutor(chat_client=self.chat_client)
        risk_analyst_agent = RiskAgentExecutor(chat_client=self.chat_client)
        market_analyst_agent = MarketAgentExecutor(chat_client=self.chat_client)
        compliance_analyst_agent = ComplianceAgentExecutor(chat_client=self.chat_client)
        summarizer_agent = AnalysisSummarizer(expert_ids=[financial_analyst_agent.id, risk_analyst_agent.id, market_analyst_agent.id, compliance_analyst_agent.id], chat_client=self.chat_client)
        
        self.workflow  = (
            WorkflowBuilder()
            .set_start_executor(planner_agent)
            .add_fan_out_edges(planner_agent, [financial_analyst_agent, risk_analyst_agent, market_analyst_agent, compliance_analyst_agent])
            .add_fan_in_edges([financial_analyst_agent, risk_analyst_agent, market_analyst_agent, compliance_analyst_agent], summarizer_agent)
            .build()
        )
    
    async def run_workflow_stream(self, input: WhatIfChatWorkflowInputData):
        if self.workflow is None:
            raise ValueError("Workflow not initialized. Call initialize_workflow() first.")
        
        logger.info(f"Running What-If Chat workflow")
        async for event in self.workflow.run_stream(message=input):
            yield event
