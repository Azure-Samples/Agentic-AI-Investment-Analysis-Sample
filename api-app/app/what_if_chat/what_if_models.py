from dataclasses import dataclass
from pydantic import BaseModel

from agent_framework import AgentRunResponse, ChatMessage

from app.models import Analysis


class PlanningAgentStepResponseModel(BaseModel):
    number: int
    task: str
    assigned_agent: str

class PlanningAgentResponseModel(BaseModel):
    name: str
    description: str
    steps: list[PlanningAgentStepResponseModel]
    message: str
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "steps": [step.model_dump() for step in self.steps],
            "message": self.message
        }

@dataclass
class ExecutionPlan:
    agent_id: str
    analysis: Analysis
    input_messages: ChatMessage | list[ChatMessage]
    plan: PlanningAgentResponseModel

@dataclass
class AnalystAgentOutput:
    agent_id: str
    response: AgentRunResponse

@dataclass
class ConversationContext:
    conversation_id: str
    message_history: list[ChatMessage]

@dataclass
class WhatIfChatWorkflowInputData:
    analysis: Analysis
    conversation_context: ConversationContext
    input_messages: ChatMessage | list[ChatMessage]
