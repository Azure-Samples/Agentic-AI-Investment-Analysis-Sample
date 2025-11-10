from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from . import BaseRepository
from app.models import Analysis

class AnalysisRepository(BaseRepository):
    """Repository for Analysis operations"""

    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "analysis")

    async def get_all_analyses(
        self,
        is_active: bool = True,
        owner_id: Optional[str] = None
    ) -> List[Analysis]:
        """Get all analyses with optional filtering"""
        query = "SELECT * FROM c WHERE c.is_active = @is_active"
        parameters = [{"name": "@is_active", "value": is_active}]
        
        if owner_id:
            query += " AND c.owner_id = @owner_id"
            parameters.append({"name": "@owner_id", "value": owner_id})
        
        query += " ORDER BY c.created_at DESC"
        
        analyses_data = await self.query(query, parameters)
        return [Analysis(**analysis) for analysis in analyses_data]

    async def get_by_opportunity(self, opportunity_id: str) -> List[Analysis]:
        """Get all analyses for a specific opportunity_id"""
        
        query = "SELECT * FROM c WHERE c.opportunity_id = @opportunity_id AND c.is_active = true ORDER BY c.created_at DESC"
        parameters = [{"name": "@opportunity_id", "value": opportunity_id}]
        
        _data = await self.query(query, parameters)
        return [Analysis(**doc) for doc in _data]

    async def get_analysis_by_id(self, analysis_id: str, opportunity_id: str, owner_id: Optional[str] = None) -> Optional[Analysis]:
        """Get a single analysis by ID"""
        item = await self.get_by_id(analysis_id, opportunity_id)
        
        if not item:
            return None
        
        analysis = Analysis(**item)
        
        # Verify ownership if owner_id is provided
        if owner_id and analysis.owner_id != owner_id:
            return None
        
        return analysis
    
    async def create_analysis(self, item: Analysis) -> Analysis:
        """Create a new analysis"""
        _dict = item.model_dump(by_alias=True)
        _created = await self.create(_dict)
        return Analysis(**_created)
    
    async def update_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        updates: Dict[str, Any],
        owner_id: Optional[str] = None
    ) -> Optional[Analysis]:
        """Update an existing analysis"""
        # Verify analysis exists and user has access
        existing = await self.get_analysis_by_id(analysis_id, opportunity_id, owner_id)
        if not existing:
            return None
        
        # Update the analysis
        updated_item = await self.update(analysis_id, updates, opportunity_id)
        return Analysis(**updated_item)
    
    async def delete_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: Optional[str] = None,
        soft_delete: bool = True
    ) -> bool:
        """Delete an analysis (soft delete by default)"""
        # Verify analysis exists and user has access
        existing = await self.get_analysis_by_id(analysis_id=analysis_id, 
                                                 opportunity_id=opportunity_id, 
                                                 owner_id=owner_id)
        if not existing:
            return False
        
        if soft_delete:
            # Soft delete: mark as inactive
            await self.update(analysis_id, {"is_active": False}, opportunity_id)
        else:
            # Hard delete: remove from database
            await self.delete(analysis_id, opportunity_id)
        
        return True
