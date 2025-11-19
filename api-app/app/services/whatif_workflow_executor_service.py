"""
Analysis Workflow Execution Service
Manages the execution of AI agents in the analysis workflow
"""
from typing import TYPE_CHECKING, Collection, List
import logging

from agent_framework import (ExecutorInvokedEvent, 
                             ExecutorCompletedEvent, 
                             ExecutorFailedEvent, 
                             WorkflowEvent, 
                             WorkflowStartedEvent, 
                             WorkflowRunState, 
                             WorkflowFailedEvent, 
                             WorkflowOutputEvent, 
                             WorkflowStatusEvent,
                             ChatMessage)

from app.utils.sse_stream_event_queue import SSEStreamEventQueue
from app.dependencies import get_chat_client
from app.database.repositories import WhatIfMessageRepository
from app.services import AnalysisService
from app.what_if_chat import WhatIfChatWorkflow, ConversationContext, WhatIfChatWorkflowInputData
from app.models import StreamEventMessage, WhatIfMessage, WhatIfConversation

logger = logging.getLogger("app.workflow.what_if_workflow_executor")

class WhatIfWorkflowExecutorService:
    """Executes the analysis workflow with AI agents"""

    SAMPLE_COMPANY_NAME = "TechCorp Inc."
    SAMPLE_INVESTMENT_HYPOTHESIS = (
        "TechCorp Inc. shows strong revenue growth and market expansion potential in the AI software sector"
    )
    SAMPLE_INVESTMENT_STAGE = "Series B"
    SAMPLE_INDUSTRY = "AI Software"
    
    def __init__(
        self,
        analysis_service: AnalysisService,
        what_if_message_repository: WhatIfMessageRepository = None
    ):
        self.analysis_service = analysis_service
        self.what_if_message_repository = what_if_message_repository
    
    async def initialize(self):
        """Initialize the workflow executor service"""
        self.chat_client = await get_chat_client()
        self.workflow = WhatIfChatWorkflow(chat_client=self.chat_client)
        await self.workflow.initialize_workflow()
    
    async def _try_get_conversation_context(self, conversation_id: str, analysis_id: str, owner_id: str) -> ConversationContext:
        """Retrieve conversation context (e.g., message history)"""
        conversation: WhatIfConversation = await self.what_if_message_repository.get_conversation_by_id(conversation_id, analysis_id)
        
        conversation_context: ConversationContext = None
        
        if not conversation:
            # create a new conversation and store in the database
            new_conversation = WhatIfConversation(
                user_id=owner_id,
                conversation_id=conversation_id,
                analysis_id=analysis_id,
                title=f"What If Conversation for Analysis {analysis_id}",
                messages=[]
            )
            await self.what_if_message_repository.create_conversation(new_conversation)
            
            conversation_context = ConversationContext(
                conversation_id=conversation_id,
                message_history=[]
            )

        elif conversation.messages and len(conversation.messages) > 0:
            history_messages = sorted(conversation.messages, key=lambda msg: msg.sequence_number)
            conversation_context = ConversationContext(
                conversation_id=conversation_id,
                message_history=[ChatMessage(role=msg.role, text=msg.text, author_name=msg.author) for msg in history_messages]
            )
            
        return conversation_context
    
    async def try_persist_conversation_message(
        self,
        conversation_id: str,
        analysis_id: str,
        role: str,
        author: str,
        text: str,
        content: dict[str, any],
        sequence_number: int
    ):
        try:
            await self.what_if_message_repository.add_message_to_conversation(
                conversation_id=conversation_id,
                analysis_id=analysis_id,
                item=WhatIfMessage(
                    role=role,
                    author=author,
                    text=text,
                    content=content,
                    sequence_number=sequence_number
                )
            )
        except Exception as e:
            logger.error(f"Failed to persist conversation message for conversation {conversation_id}: {str(e)}")
            logger.exception(e)
    
    async def _handle_event(self, sse_event_queue: SSEStreamEventQueue, event: WorkflowEvent, conversation_id: str, analysis_id: str, sequence_number: int = 0):
        """Handle a workflow event and send to the sse event queue"""
        
        if event is None:
            return

        logger.debug(f"Handling workflow event: {event}")
        
        message_type = None
        executor = None
        data = {}
        message = None
        
        if isinstance(event, WorkflowStartedEvent):
            message_type = "workflow_started"
            message = "What If Workflow execution started"
        elif isinstance(event, WorkflowFailedEvent):
            message_type = "error"
            message = "What If Workflow execution failed"
            executor = event.details.executor_id
            data = {"error": event.details.message, 
                    "error_type": event.details.error_type,
                    "traceback": event.details.traceback,
                    "extra": event.details.extra
                    }
            # fail the analysis in the database
            # await self.analysis_service.fail_analysis(error_details=data)

        elif isinstance(event, WorkflowStatusEvent):
            message_type = "workflow_status"
            data = {"state": event.state.value}
            
            # update analysis status if completed
            if event.state == WorkflowRunState.IDLE:
                # IDLE indicates completed
                message_type = "workflow_completed"
                message = "What If Workflow execution completed"
            elif event.state == WorkflowRunState.FAILED:
                message = "What If Workflow execution failed"
            elif event.state == WorkflowRunState.IN_PROGRESS:
                message = "What If Workflow is running"
                
        elif isinstance(event, ExecutorInvokedEvent):
            message_type = "executor_invoked"
            executor = event.executor_id
            
        elif isinstance(event, ExecutorCompletedEvent):
            message_type = "executor_completed"
            executor = event.executor_id
            data = event.data or {}
            
        elif isinstance(event, WorkflowOutputEvent):
            message_type = "workflow_output"
            executor = event.source_executor_id
            if executor == "planning_agent_executor":
                message_type = "reasoning"
            else:
                message_type = "markdown"
            data = event.data or {}
            
        elif isinstance(event, ExecutorFailedEvent):
            message_type = "executor_failed"
            executor = event.executor_id
            data = {
                "error": event.details.message,
                "error_type": event.details.error_type,
                "traceback": event.details.traceback,
                "extra": event.details.extra
            }
        else:
            message_type = "unknown_event"
            
        # Add event to the queue (for SSE streaming) and cache it
        await sse_event_queue.add_event(
            StreamEventMessage(
                type=message_type,
                executor=executor,
                data=data,
                message=message
            )
        )
        
        # save the message
        if isinstance(event, WorkflowOutputEvent):
            await self.try_persist_conversation_message(
                conversation_id=conversation_id,
                analysis_id=analysis_id,
                role="assistant",
                author=executor or "Assistant",
                text=isinstance(data, str) and data or str(data),
                content=data.to_dict() if hasattr(data, "to_dict") else data,
                sequence_number=sequence_number
            )
            
    async def execute_workflow(
        self,
        input_message: str,
        conversation_id: str,
        sse_event_queue: SSEStreamEventQueue,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str
    ):
        """
        Execute the complete what-if workflow
        This runs in the background and emits events to the event queue
        """
        try:
            logger.info(f"Starting workflow execution for conversation {conversation_id}")
            
            # get the opportunity details
            analysis = await self.analysis_service.get_analysis_by_id(analysis_id=analysis_id, 
                                                                      opportunity_id=opportunity_id)
            if not analysis:
                raise Exception(f"Analysis {analysis_id} not found for opportunity {opportunity_id}")
            

            # get the conversation history for context
            conversation_context = await self._try_get_conversation_context(conversation_id=conversation_id, 
                                                                            analysis_id=analysis_id,
                                                                            owner_id=owner_id)
            
            next_seq_num = conversation_context.message_history is not None and len(conversation_context.message_history) + 1 or 1
            
            # persist the the input message
            await self.try_persist_conversation_message(
                conversation_id=conversation_id,
                analysis_id=analysis_id,
                role="user",
                author="User",
                text=input_message,
                content=None,
                sequence_number=next_seq_num
            )
                        
            # Create the input message for the workflow
            input = WhatIfChatWorkflowInputData(
                analysis=analysis,
                conversation_context=conversation_context,
                input_messages=ChatMessage(role="user", text=input_message, author_name="User")
            )

            # Run the workflow and handle events           
            async for workflow_event in self.workflow.run_workflow_stream(input=input):
                next_seq_num += 1
                # Handle each event
                await self._handle_event(sse_event_queue=sse_event_queue, 
                                         event=workflow_event, 
                                         conversation_id=conversation_id, 
                                         analysis_id=analysis_id,
                                         sequence_number=next_seq_num)
            
            
            logger.info(f"Workflow execution completed for conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"Workflow execution failed for analysis {analysis_id}: {str(e)}")
            logger.exception(e)
            
            # Emit workflow failed event
            await sse_event_queue.add_event(
                StreamEventMessage(
                    type="error",
                    data={"error": str(e),
                        "error_type": e.__class__.__name__,
                        "traceback": str(e.__traceback__)
                        },
                    message=f"What-if chat workflow failed: {str(e)}"
                )
            )
            
    async def list_conversations(
        self,
        analysis_id: str,
        page: int = 1,
        page_size: int = 10
    ) -> List[WhatIfConversation]:
        """List all conversation IDs with pagination"""
        conversations = await self.what_if_message_repository.list_conversations(analysis_id=analysis_id, page=page, limit=page_size)
        return conversations
        
        