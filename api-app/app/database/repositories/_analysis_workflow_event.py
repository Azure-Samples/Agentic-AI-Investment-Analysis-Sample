from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from . import BaseRepository
from app.models import AnalysisWorkflowEvent

class AnalysisWorkflowEventRepository(BaseRepository):
    """Repository for AnalysisWorkflowEvent operations"""

    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "workflow_events")

    async def get_events_by_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: Optional[str] = None
    ) -> List[AnalysisWorkflowEvent]:
        """Get all events for a specific analysis"""
        query = "SELECT * FROM c WHERE c.analysis_id = @analysis_id AND c.opportunity_id = @opportunity_id AND c.is_deleted = false"
        parameters = [
            {"name": "@analysis_id", "value": analysis_id},
            {"name": "@opportunity_id", "value": opportunity_id}
        ]
        
        if owner_id:
            query += " AND c.owner_id = @owner_id"
            parameters.append({"name": "@owner_id", "value": owner_id})
        
        query += " ORDER BY c.sequence ASC"
        
        events_data = await self.query(query, parameters)
        return [AnalysisWorkflowEvent(**event) for event in events_data]

    async def create_event(self, event: AnalysisWorkflowEvent) -> AnalysisWorkflowEvent:
        """Create a new workflow event"""
        _dict = event.model_dump(by_alias=True)
        _created = await self.create(_dict)
        return AnalysisWorkflowEvent(**_created)
    
    async def create_events_batch(self, events: List[AnalysisWorkflowEvent]) -> List[AnalysisWorkflowEvent]:
        """Create multiple workflow events in batch"""
        created_events = []
        for event in events:
            created_event = await self.create_event(event)
            created_events.append(created_event)
        return created_events
    
    async def delete_events_by_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: Optional[str] = None,
        soft_delete: bool = True
    ) -> int:
        """Delete all events for a specific analysis"""
        # Get all events for this analysis
        events = await self.get_events_by_analysis(analysis_id=analysis_id, 
                                                   opportunity_id=opportunity_id, 
                                                   owner_id=owner_id)
        
        deleted_count = 0
        for event in events:
            if soft_delete:
                # Soft delete: mark as deleted
                await self.update(item_id=event.id, updates={"is_deleted": True}, partition_key=analysis_id)
            else:
                # Hard delete: remove from database
                await self.delete(item_id=event.id, partition_key=analysis_id)
            deleted_count += 1
        
        return deleted_count
