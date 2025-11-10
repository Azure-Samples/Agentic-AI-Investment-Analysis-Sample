"""
Analysis Workflow Execution Service
Manages the execution of AI agents in the analysis workflow
"""
from typing import TYPE_CHECKING
import logging

from agent_framework import ExecutorInvokedEvent, ExecutorCompletedEvent, ExecutorFailedEvent, WorkflowEvent, WorkflowStartedEvent, WorkflowRunState, WorkflowFailedEvent, WorkflowOutputEvent, WorkflowStatusEvent

from . import get_event_queue
from app.dependencies import get_chat_client
from .investment_models import AnalysisRunInput
from .investment_workflow import InvestmentAnalysisWorkflow
from app.services import AnalysisService, OpportunityService

if TYPE_CHECKING:
    from app.services import WorkflowEventsService

logger = logging.getLogger("app.workflow.workflow_executor")

class WorkflowExecutor:
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
        opportunity_service: OpportunityService,
        workflow_events_service: "WorkflowEventsService"
    ):
        self.analysis_service = analysis_service
        self.opportunity_service = opportunity_service
        self.workflow_events_service = workflow_events_service
        self.event_queue = get_event_queue()
    
    async def _handle_event(self, event: WorkflowEvent, analysis_id: str, opportunity_id: str):
        """Handle a workflow event and send to event queue"""
        
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
            await self.analysis_service.fail_analysis(analysis_id=analysis_id, opportunity_id=opportunity_id, error_details=data)

        elif isinstance(event, WorkflowStatusEvent):
            event_type = "workflow_status"
            data = {"state": event.state.value}
            
            # update analysis status if completed
            if event.state == WorkflowRunState.IDLE:
                # IDLE indicates completed
                await self.analysis_service.complete_analysis(analysis_id=analysis_id, opportunity_id=opportunity_id)
                
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
        event_message = await self.event_queue.add_event_message(
            analysis_id=analysis_id,
            event_type=event_type,
            executor=executor,
            data=data,
            message=message
        )
        
        # Cache the event for later persistence to database
        self.workflow_events_service.cache_event(analysis_id=analysis_id, 
                                                 event_message=event_message)
        
        # save the output
        if isinstance(event, WorkflowOutputEvent):
            await self.analysis_service.save_agent_result(
                    analysis_id=analysis_id,
                    opportunity_id=opportunity_id,
                    executor_id=executor,
                    result=data or {}
                )
            
    async def execute_workflow(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str
    ):
        """
        Execute the complete analysis workflow
        This runs in the background and emits events to the event queue
        """
        try:
            logger.info(f"Starting workflow execution for analysis {analysis_id}")
            
            # get the opportunity details
            analysis = await self.analysis_service.get_analysis_by_id(analysis_id=analysis_id, opportunity_id=opportunity_id)
            if not analysis:
                raise Exception(f"Analysis {analysis_id} not found for opportunity {opportunity_id}")
            
            opportunity = await self.opportunity_service.get_opportunity_by_id(opportunity_id=opportunity_id, owner_id=owner_id)
            if not opportunity:
                raise Exception(f"Opportunity {opportunity_id} not found for owner {owner_id}")

            # Create the analysis run input
            analysis_input = AnalysisRunInput(
                hypothesis=analysis.investment_hypothesis or WorkflowExecutor.SAMPLE_INVESTMENT_HYPOTHESIS,
                opportunity_id=opportunity.id,
                analysis_id=analysis.id,
                owner_id=owner_id,
                company_name=opportunity.settings.get("company_name", WorkflowExecutor.SAMPLE_COMPANY_NAME),
                stage=opportunity.settings.get("stage", WorkflowExecutor.SAMPLE_INVESTMENT_STAGE),
                industry=opportunity.settings.get("industry", WorkflowExecutor.SAMPLE_INDUSTRY)
            )

            chat_client = await get_chat_client()
            workflow = InvestmentAnalysisWorkflow(chat_client=chat_client)
            await workflow.initialize_workflow()
            
            async for event in workflow.run_workflow_stream(analysis_input):
                # Handle each event
                await self._handle_event(event, analysis_id=analysis_id, opportunity_id=opportunity_id)
            
            logger.info(f"Workflow execution completed for analysis {analysis_id}")
            
            # Persist all cached events to the database
            try:
                persisted_events = await self.workflow_events_service.persist_cached_events(
                    analysis_id=analysis_id,
                    opportunity_id=opportunity_id,
                    owner_id=owner_id
                )
                logger.info(f"Persisted {len(persisted_events)} events to database for analysis {analysis_id}")
            except Exception as persist_error:
                logger.error(f"Failed to persist events to database: {str(persist_error)}")
                logger.exception(persist_error)
            
        except Exception as e:
            logger.error(f"Workflow execution failed for analysis {analysis_id}: {str(e)}")
            logger.exception(e)
            
            # Update analysis as failed
            try:
                await self.analysis_service.fail_analysis(
                    analysis_id=analysis_id,
                    opportunity_id=opportunity_id,
                    error_details={"error": str(e),
                                   "error_type": e.__class__.__name__,
                                   "traceback": str(e.__traceback__)
                                   }
                )
            except Exception as update_error:
                logger.error(f"Failed to update analysis status: {str(update_error)}")
            
            # Emit workflow failed event
            await self.event_queue.add_event_message(
                analysis_id=analysis_id,
                event_type="workflow_failed",
                data={"error": str(e),
                      "error_type": e.__class__.__name__,
                      "traceback": str(e.__traceback__)
                    },
                message=f"Analysis workflow failed: {str(e)}"
            )
            
            # Still try to persist events even if workflow failed
            try:
                persisted_events = await self.workflow_events_service.persist_cached_events(
                    analysis_id=analysis_id,
                    opportunity_id=opportunity_id,
                    owner_id=owner_id
                )
                logger.info(f"Persisted {len(persisted_events)} events to database after failure for analysis {analysis_id}")
            except Exception as persist_error:
                logger.error(f"Failed to persist events after workflow failure: {str(persist_error)}")
                logger.exception(persist_error)