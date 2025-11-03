from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any, AsyncGenerator
from pydantic import BaseModel, ConfigDict, Field
import logging
import asyncio

from app.core.auth import get_current_active_user
from app.services.analysis_service import AnalysisService
from app.workflow import WorkflowExecutor, get_event_queue
from app.dependencies import get_analysis_service
from app.models import Analysis, User

router = APIRouter(prefix="/analysis", tags=["analysis"])

logger = logging.getLogger("app.routers.analysis")

# region Models

class AnalysisResponse(BaseModel):
    id: str
    name: str
    tags: List[str] = []
    opportunity_id: str
    investment_hypothesis: Optional[str] = None
    status: str
    overall_score: Optional[int] = None
    agent_results: Dict[str, Any] = {}
    result: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    owner_id: str
    is_active: bool = True
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
            overall_score=analysis.overall_score,
            agent_results=analysis.agent_results,
            result=analysis.result,
            started_at=analysis.started_at,
            completed_at=analysis.completed_at,
            owner_id=analysis.owner_id,
            is_active=analysis.is_active,
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


class AnalysisCompleteRequest(BaseModel):
    overall_score: Optional[int] = Field(None, description="Overall investment score (0-100)")
    agent_results: Optional[Dict[str, Any]] = Field(None, description="Results from each agent")
    result: Optional[str] = Field(None, description="Final result summary")


class AnalysisFailRequest(BaseModel):
    error_message: Optional[str] = Field(None, description="Error message describing the failure")

# endregion

# region Routes

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


@router.put("/{opportunity_id}/{analysis_id}", response_model=AnalysisResponse)
async def update_analysis(
    opportunity_id: str,
    analysis_id: str,
    request: AnalysisUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Update an existing analysis"""
    try:
        analysis = await analysis_service.update_analysis(
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email,
            name=request.name,
            investment_hypothesis=request.investment_hypothesis,
            status=request.status,
            overall_score=request.overall_score,
            agent_results=request.agent_results,
            result=request.result,
            tags=request.tags,
            is_active=request.is_active
        )
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis {analysis_id} not found"
            )
        return AnalysisResponse.from_analysis(analysis)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update analysis: {str(e)}"
        )


@router.delete("/{opportunity_id}/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    opportunity_id: str,
    analysis_id: str,
    soft_delete: bool = Query(True, description="Use soft delete (mark as inactive)"),
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Delete an analysis"""
    try:
        deleted = await analysis_service.delete_analysis(
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email,
            soft_delete=soft_delete
        )
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


@router.post("/{opportunity_id}/{analysis_id}/start", response_model=AnalysisResponse)
async def start_analysis(
    opportunity_id: str,
    analysis_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """Start an analysis run with background workflow execution"""
    try:
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
        
        # Execute workflow in background
        workflow_executor = WorkflowExecutor(analysis_service)
        background_tasks.add_task(
            workflow_executor.execute_workflow,
            analysis_id=analysis_id,
            opportunity_id=opportunity_id,
            owner_id=current_user.email,
            investment_hypothesis=analysis.investment_hypothesis
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


@router.get("/{opportunity_id}/{analysis_id}/events")
async def stream_analysis_events(
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
        
        async def event_generator() -> AsyncGenerator[str, None]:
            """Generate SSE events for the analysis"""
            event_queue = get_event_queue()
            
            try:
                # First, send any historical events (if reconnecting)
                if since_sequence is not None:
                    logger.info(f"Client reconnecting to analysis {analysis_id}, fetching events since {since_sequence}")
                    historical_events = await event_queue.get_events(
                        analysis_id=analysis_id,
                        since_sequence=since_sequence
                    )
                    for event in historical_events:
                        yield event.to_sse_format()
                else:
                    # Send all existing events
                    all_events = await event_queue.get_events(analysis_id=analysis_id)
                    for event in all_events:
                        yield event.to_sse_format()
                
                # Register for live updates
                listener_queue = await event_queue.register_listener(analysis_id)
                
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
                    await event_queue.unregister_listener(analysis_id, listener_queue)
                    
            except Exception as e:
                logger.error(f"Error in event stream for analysis {analysis_id}: {str(e)}")
                # Send error event
                error_data = f'data: {{"event_type": "error", "message": "Stream error: {str(e)}"}}\n\n'
                yield error_data
        
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
        
# endregion
