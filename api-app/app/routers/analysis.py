from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any, AsyncGenerator
from pydantic import BaseModel, ConfigDict, Field
import logging
import asyncio

from app.core.auth import get_current_active_user
from app.services import AnalysisService, AnalysisWorkflowEventsService, AnalysisWorkflowExecutorService
from app.dependencies import (close_sse_event_queue_for_session, get_analysis_service, 
                              get_sse_event_queue_for_session, 
                              get_analysis_workflow_execution_service, 
                              get_analysis_workflow_events_service)
from app.models import Analysis, User, AnalysisWorkflowEvent

router = APIRouter(prefix="/analysis", tags=["analysis"])

logger = logging.getLogger("app.routers.analysis")

# region Request/Response Models

class AnalysisResponse(BaseModel):
    id: str
    name: str
    tags: List[str] = []
    opportunity_id: str
    investment_hypothesis: Optional[str] = None
    status: str
    agent_results: Dict[str, Any] = {}
    result: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    owner_id: str
    is_active: bool = True
    error_details: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

    @classmethod
    def from_analysis(cls, analysis: Analysis) -> "AnalysisResponse":
        return cls(
            id=analysis.id,
            name=analysis.name,
            tags=analysis.tags,
            opportunity_id=analysis.opportunity_id,
            investment_hypothesis=analysis.investment_hypothesis,
            status=analysis.status,
            agent_results=analysis.agent_results,
            result=analysis.result,
            started_at=analysis.started_at,
            completed_at=analysis.completed_at,
            owner_id=analysis.owner_id,
            is_active=analysis.is_active,
            error_details=analysis.error_details,
            created_at=analysis.created_at,
            updated_at=analysis.updated_at
        )


class AnalysisCreateRequest(BaseModel):
    name: str = Field(..., description="Name for the analysis run")
    opportunity_id: str = Field(..., description="ID of the opportunity being analyzed")
    investment_hypothesis: Optional[str] = Field(None, description="Investment hypothesis for the analysis")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")


class AnalysisUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, description="Name for the analysis run")
    investment_hypothesis: Optional[str] = Field(None, description="Investment hypothesis for the analysis")
    status: Optional[str] = Field(None, description="Status: pending, in_progress, completed, failed")
    overall_score: Optional[int] = Field(None, description="Overall investment score (0-100)")
    agent_results: Optional[Dict[str, Any]] = Field(None, description="Results from each agent")
    result: Optional[str] = Field(None, description="Final result summary")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")
    is_active: Optional[bool] = Field(None, description="Whether the analysis is active")


class AnalysisStartRequest(BaseModel):
    pass  # No additional fields needed for starting


# endregion

################################

# region Routes

# region Analysis CRUD and Management

@router.get("/", response_model=List[AnalysisResponse])
async def get_analyses(
    is_active: bool = Query(True, description="Filter by active status"),
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Get all analyses for the current user"""
    try:
        analyses = await analysis_service.get_analyses(
            is_active=is_active,
            owner_id=current_user.email
        )
        return [AnalysisResponse.from_analysis(analysis) for analysis in analyses]
    except Exception as e:
        logger.error(f"Error getting analyses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analyses: {str(e)}"
        )


@router.get("/opportunity/{opportunity_id}", response_model=List[AnalysisResponse])
async def get_analyses_by_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Get all analyses for a specific opportunity"""
    try:
        analyses = await analysis_service.get_analyses_by_opportunity(opportunity_id)
        # Filter by owner
        #user_analyses = [a for a in analyses if a.owner_id == current_user.id]
        return [AnalysisResponse.from_analysis(analysis) for analysis in analyses]
    except Exception as e:
        logger.error(f"Error getting analyses for opportunity {opportunity_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analyses: {str(e)}"
        )


@router.get("/{opportunity_id}/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    opportunity_id: str,
    analysis_id: str,
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Get a specific analysis by ID"""
    try:
        analysis = await analysis_service.get_analysis_by_id(analysis_id, opportunity_id, current_user.email)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis {analysis_id} not found"
            )
        return AnalysisResponse.from_analysis(analysis)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analysis: {str(e)}"
        )


@router.post("/", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    request: AnalysisCreateRequest,
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Create a new analysis"""
    try:
        analysis = await analysis_service.create_analysis(
            name=request.name,
            opportunity_id=request.opportunity_id,
            owner_id=current_user.email,
            investment_hypothesis=request.investment_hypothesis,
            tags=request.tags
        )
        return AnalysisResponse.from_analysis(analysis)
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create analysis: {str(e)}"
        )

@router.delete("/{opportunity_id}/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    opportunity_id: str,
    analysis_id: str,
    soft_delete: bool = Query(True, description="Use soft delete (mark as inactive)"),
    current_user: User = Depends(get_current_active_user),
    workflow_events_service: AnalysisWorkflowEventsService = Depends(get_analysis_workflow_events_service),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Delete an analysis"""
    try:
        
        # First delete associated workflow events
        deleted_events_count = await workflow_events_service.delete_events_by_analysis(
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email,
            soft_delete=soft_delete
        )
        logger.debug(f"Deleted {deleted_events_count} events for analysis {analysis_id}")
        
        # Now delete the analysis itself
        deleted = await analysis_service.delete_analysis(
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email,
            soft_delete=soft_delete
        )
        logger.debug(f"Analysis {analysis_id} deletion status: {deleted}")
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis {analysis_id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete analysis: {str(e)}"
        )

# end region

# region Analysis Execution and Events

@router.post("/{opportunity_id}/{analysis_id}/start/{client_id}", response_model=AnalysisResponse)
async def start_analysis(
    client_id: str, # path param for session identification, used for creating a distinct event queue. In production this could be a user session ID or similar.
    opportunity_id: str,
    analysis_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service),
    execution_service: AnalysisWorkflowExecutorService = Depends(get_analysis_workflow_execution_service),
):
    """Start an analysis run with background workflow execution"""
    try:
        if not client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="client_id path parameter is required for event streaming"
            )
        
        # Mark analysis as started
        analysis = await analysis_service.start_analysis(
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email
        )
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Failed to start. Analysis {analysis_id} not found"
            )
        
        # Get the event queue for this client/session
        sse_event_queue = await get_sse_event_queue_for_session(client_id)
        
        # Execute workflow in background
        workflow_executor_function = execution_service.execute_workflow
        background_tasks.add_task(
            workflow_executor_function,
            sse_event_queue=sse_event_queue,
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email
        )
        
        logger.info(f"Started background workflow for analysis {analysis_id}")
        
        return AnalysisResponse.from_analysis(analysis)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start analysis: {str(e)}"
        )


@router.get("/{opportunity_id}/{analysis_id}/stream/{client_id}")
async def stream_analysis_events(
    client_id: str, # path param for session identification, used for retrieving the distinct event queue. In production this could be a user session ID or similar.
    opportunity_id: str,
    analysis_id: str,
    since_sequence: Optional[int] = Query(None, description="Get events since this sequence number"),
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """
    Stream analysis execution events via Server-Sent Events (SSE)
    
    This endpoint supports reconnection - clients can pass the last sequence number
    they received to get only new events since that point.
    """
    try:
        if not client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="client_id path parameter is required for event streaming"
            )
        
        # Verify the analysis exists and user has access
        analysis = await analysis_service.get_analysis_by_id(
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email
        )
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis {analysis_id} not found"
            )
        
        # Get the event queue for this client/session
        sse_event_queue = await get_sse_event_queue_for_session(client_id)
        
        async def clean_up():
            logger.info(f"Cleaning up event stream for analysis {analysis_id} and client {client_id}")
            await close_sse_event_queue_for_session(client_id)
        
        async def event_generator() -> AsyncGenerator[str, None]:
            """Generate SSE events for the analysis"""
            
            try:
                # First, send any historical events (if reconnecting)
                if since_sequence is not None:
                    logger.info(f"Client reconnecting to analysis {analysis_id}, fetching events since {since_sequence}")
                    historical_events = await sse_event_queue.get_events(
                        since_sequence=since_sequence
                    )
                    for event in historical_events:
                        yield event.to_sse_format()
                else:
                    # Send all existing events
                    all_events = await sse_event_queue.get_events()
                    for event in all_events:
                        yield event.to_sse_format()
                
                # Register for live updates
                listener_queue = await sse_event_queue.register_listener()
                
                try:
                    # Stream live events
                    while True:
                        try:
                            # Wait for new events with timeout to allow for keep-alive
                            event = await asyncio.wait_for(listener_queue.get(), timeout=30.0)
                            yield event.to_sse_format()
                            
                        except asyncio.TimeoutError:
                            # Send keep-alive comment to prevent connection timeout
                            yield ": keep-alive\n\n"
                            
                except asyncio.CancelledError:
                    logger.info(f"Client disconnected from analysis {analysis_id} event stream")
                    raise
                finally:
                    # Cleanup listener
                    await sse_event_queue.unregister_listener(listener_queue)
                    
            except Exception as e:
                logger.error(f"Error in event stream for analysis {analysis_id}: {str(e)}")
                logger.exception(e)
                # Send error event
                error_data = f'data: {{"type": "error", "message": "Stream error: {str(e)}", "data":  {{"error": "{str(e)}", "error_type": "{type(e).__name__}"}} , "timestamp": "{datetime.now(timezone.utc).isoformat()}"}}\n\n'
                yield error_data
                
            finally:
                await clean_up()
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable buffering in nginx
                "Access-Control-Allow-Origin": "*",  # Allow CORS for SSE
                "Access-Control-Allow-Credentials": "true"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up event stream for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to setup event stream: {str(e)}"
        )


@router.get("/{opportunity_id}/{analysis_id}/events", response_model=List[AnalysisWorkflowEvent])
async def fetch_analysis_events(
    opportunity_id: str,
    analysis_id: str,
    current_user: User = Depends(get_current_active_user),
    workflow_events_service: AnalysisWorkflowEventsService = Depends(get_analysis_workflow_events_service),
):
    """Fetch all events for a specific analysis"""
    
    try:
        events = await workflow_events_service.get_events_by_analysis(analysis_id=analysis_id, 
                                                                      opportunity_id=opportunity_id, 
                                                                      owner_id=current_user.email)
    
        return events
    except HTTPException:
            raise
    except Exception as e:
        logger.error(f"Error fetching events for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch events for analysis: {str(e)}"
        )
        
# endregion