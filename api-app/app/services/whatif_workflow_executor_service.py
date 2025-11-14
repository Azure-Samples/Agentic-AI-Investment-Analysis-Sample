"""
Analysis Workflow Execution Service
Manages the execution of AI agents in the analysis workflow
"""
from typing import TYPE_CHECKING
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
from app.what_if_chat import WhatIfChatWorkflow
from app.services import AnalysisService
from app.models import StreamEventMessage

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
    ):
        self.analysis_service = analysis_service
    
    async def _handle_event(self, sse_event_queue: SSEStreamEventQueue, event: WorkflowEvent):
        """Handle a workflow event and send to the sse event queue"""
        
        if event is None:
            return

        logger.debug(f"Handling workflow event: {event}")
        
        event_type = None
        executor = None
        data = {}
        message = None
        
        if isinstance(event, WorkflowStartedEvent):
            event_type = "workflow_started"
            message = "Workflow execution started"
        elif isinstance(event, WorkflowFailedEvent):
            event_type = "workflow_failed"
            message = "Workflow execution failed"
            executor = event.details.executor_id
            data = {"error": event.details.message, 
                    "error_type": event.details.error_type,
                    "traceback": event.details.traceback,
                    "extra": event.details.extra
                    }
            # fail the analysis in the database
            # await self.analysis_service.fail_analysis(error_details=data)

        elif isinstance(event, WorkflowStatusEvent):
            event_type = "workflow_status"
            data = {"state": event.state.value}
            
            # update analysis status if completed
            if event.state == WorkflowRunState.IDLE:
                # IDLE indicates completed
                pass
                # await self.analysis_service.complete_analysis(analysis_id=analysis_id, opportunity_id=opportunity_id)
                
        elif isinstance(event, ExecutorInvokedEvent):
            event_type = "executor_invoked"
            executor = event.executor_id
        elif isinstance(event, ExecutorCompletedEvent):
            event_type = "executor_completed"
            executor = event.executor_id
            data = event.data or {}
        elif isinstance(event, WorkflowOutputEvent):
            event_type = "workflow_output"
            executor = event.source_executor_id
            data = event.data or {}
        elif isinstance(event, ExecutorFailedEvent):
            event_type = "executor_failed"
            executor = event.executor_id
            data = {
                "error": event.details.message,
                "error_type": event.details.error_type,
                "traceback": event.details.traceback,
                "extra": event.details.extra
            }
        else:
            event_type = "unknown_event"
            
        # Add event to the queue (for SSE streaming) and cache it
        event_message = await sse_event_queue.add_event(
            StreamEventMessage(
                type=event_type,
                executor=executor,
                data=data,
                message=message
            )
        )
        
        # Cache the event for later persistence to database
        # self.workflow_events_service.cache_event(event_message=event_message)
        #                                          event_message=event_message)
        
        # save the output
        # if isinstance(event, WorkflowOutputEvent):
        #     await self.analysis_service.save_agent_result(
        #             analysis_id=analysis_id,
        #             opportunity_id=opportunity_id,
        #             executor_id=executor,
        #             result=data or {}
        #         )
            
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
            analysis = await self.analysis_service.get_analysis_by_id(analysis_id=analysis_id, opportunity_id=opportunity_id)
            if not analysis:
                raise Exception(f"Analysis {analysis_id} not found for opportunity {opportunity_id}")
            

            # get the conversation history for context
                        
            # Create the input message for the workflow
            input = ChatMessage(role="user", text=input_message)

            chat_client = await get_chat_client()
            workflow = WhatIfChatWorkflow(chat_client=chat_client)
            await workflow.initialize_workflow(analysis_result=analysis)
            
            async for event in workflow.run_workflow_stream(input_messages=input):
                # Handle each event
                await self._handle_event(sse_event_queue=sse_event_queue, event=event)
            
            logger.info(f"Workflow execution completed for conversation {conversation_id}")
            
            # # Persist all cached events to the database
            # try:
            #     persisted_events = await self.workflow_events_service.persist_cached_events(
            #         analysis_id=analysis_id,
            #         opportunity_id=opportunity_id,
            #         owner_id=owner_id
            #     )
            #     logger.info(f"Persisted {len(persisted_events)} events to database for analysis {analysis_id}")
            # except Exception as persist_error:
            #     logger.error(f"Failed to persist events to database: {str(persist_error)}")
            #     logger.exception(persist_error)
            
        except Exception as e:
            logger.error(f"Workflow execution failed for analysis {analysis_id}: {str(e)}")
            logger.exception(e)
            
            # # Update analysis as failed
            # try:
            #     await self.analysis_service.fail_analysis(
            #         analysis_id=analysis_id,
            #         opportunity_id=opportunity_id,
            #         error_details={"error": str(e),
            #                        "error_type": e.__class__.__name__,
            #                        "traceback": str(e.__traceback__)
            #                        }
            #     )
            # except Exception as update_error:
            #     logger.error(f"Failed to update analysis status: {str(update_error)}")
            
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
            
            # # Still try to persist events even if workflow failed
            # try:
            #     persisted_events = await self.workflow_events_service.persist_cached_events(
            #         analysis_id=analysis_id,
            #         opportunity_id=opportunity_id,
            #         owner_id=owner_id
            #     )
            #     logger.info(f"Persisted {len(persisted_events)} events to database after failure for analysis {analysis_id}")
            # except Exception as persist_error:
            #     logger.error(f"Failed to persist events after workflow failure: {str(persist_error)}")
            #     logger.exception(persist_error)