from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging

from app.database.repositories import AnalysisWorkflowEventRepository
from app.models import AnalysisWorkflowEvent
from app.database.cosmos import CosmosDBClient
from app.models import StreamEventMessage


logger = logging.getLogger("app.services.analysis_workflow_events_service")

class AnalysisWorkflowEventsService:
    """Service layer for workflow event operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        self.cosmos_client = cosmos_client
        self.workflow_event_repo = AnalysisWorkflowEventRepository(cosmos_client)
        
        # In-memory cache for events during workflow execution
        self._event_cache: Dict[str, List[StreamEventMessage]] = {}

    async def get_events_by_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: Optional[str] = None
    ) -> List[AnalysisWorkflowEvent]:
        """Get all events for a specific analysis from the database"""
        try:
            events = await self.workflow_event_repo.get_events_by_analysis(
                analysis_id=analysis_id,
                opportunity_id=opportunity_id,
                owner_id=owner_id
            )
            logger.info(f"Retrieved {len(events)} events for analysis {analysis_id}")
            return events
        except Exception as e:
            logger.error(f"Error retrieving events for analysis {analysis_id}: {str(e)}")
            raise
    
    def cache_event(
        self,
        analysis_id: str,
        event_message: StreamEventMessage
    ):
        """Cache an event in memory during workflow execution"""
        if analysis_id not in self._event_cache:
            self._event_cache[analysis_id] = []
        
        self._event_cache[analysis_id].append(event_message)
        logger.debug(f"Cached event for analysis {analysis_id}: {event_message.type}")
    
    def get_cached_events(self, analysis_id: str) -> List[StreamEventMessage]:
        """Get cached events for an analysis"""
        return self._event_cache.get(analysis_id, [])
    
    def clear_cache(self, analysis_id: str):
        """Clear cached events for an analysis"""
        if analysis_id in self._event_cache:
            del self._event_cache[analysis_id]
            logger.debug(f"Cleared event cache for analysis {analysis_id}")
    
    async def persist_cached_events(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str
    ) -> List[AnalysisWorkflowEvent]:
        """Persist all cached events for an analysis to the database"""
        try:
            cached_events = self.get_cached_events(analysis_id)
            
            if not cached_events:
                logger.info(f"No cached events to persist for analysis {analysis_id}")
                return []
            
            # Convert EventMessage objects to AnalysisWorkflowEvent models
            workflow_events = []
            for event_msg in cached_events:
                workflow_event = AnalysisWorkflowEvent(
                    analysis_id=analysis_id,
                    opportunity_id=opportunity_id,
                    owner_id=owner_id,
                    type=event_msg.type,
                    executor=event_msg.executor,
                    data=event_msg.data.to_dict() if event_msg.data and hasattr(event_msg.data, "to_dict") else event_msg.data,
                    message=event_msg.message,
                    sequence=event_msg.sequence if event_msg.sequence is not None else 0,
                    timestamp=event_msg.timestamp
                )
                workflow_events.append(workflow_event)
            
            # Batch create events in the database
            created_events = await self.workflow_event_repo.create_events_batch(workflow_events)
            
            logger.info(f"Persisted {len(created_events)} events for analysis {analysis_id}")
            
            # Clear the cache after successful persistence
            self.clear_cache(analysis_id)
            
            return created_events
        except Exception as e:
            logger.error(f"Error persisting cached events for analysis {analysis_id}: {str(e)}")
            raise
    
    async def delete_events_by_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: Optional[str] = None,
        soft_delete: bool = True
    ) -> int:
        """Delete all events for a specific analysis"""
        try:
            deleted_count = await self.workflow_event_repo.delete_events_by_analysis(
                analysis_id=analysis_id,
                opportunity_id=opportunity_id,
                owner_id=owner_id,
                soft_delete=soft_delete
            )
            
            if deleted_count > 0:
                delete_type = "soft" if soft_delete else "hard"
                logger.info(f"{delete_type} deleted {deleted_count} events for analysis {analysis_id}")
            else:
                logger.warning(f"No events found for analysis {analysis_id}")
            
            return deleted_count
        except Exception as e:
            logger.error(f"Error deleting events for analysis {analysis_id}: {str(e)}")
            raise
