from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from . import BaseRepository

from app.models import Opportunity

class OpportunityRepository(BaseRepository):
    """Repository for Opportunity operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "opportunities")
    
    async def get_all_opportunities(
        self,
        is_active: bool = True,
        owner_id: Optional[str] = None
    ) -> List[Opportunity]:
        """Get all opportunities with optional filtering"""
        query = "SELECT * FROM c WHERE c.is_active = @is_active"
        parameters = [{"name": "@is_active", "value": is_active}]
        
        if owner_id:
            query += " AND c.owner_id = @owner_id"
            parameters.append({"name": "@owner_id", "value": owner_id})
        
        query += " ORDER BY c.created_at DESC"
        
        opportunities_data = await self.query(query, parameters)
        return [Opportunity(**opportunity) for opportunity in opportunities_data]
    
    async def get_opportunity_by_id(self, opportunity_id: str, owner_id: Optional[str] = None) -> Optional[Opportunity]:
        """Get a single opportunity by ID"""
        item = await self.get_by_id(opportunity_id, owner_id)
        
        if not item:
            return None
        
        opportunity = Opportunity(**item)
        
        return opportunity
    
    async def get_by_owner(self, owner_id: str) -> List[Opportunity]:
        """Get all opportunities for a specific owner"""
        query = "SELECT * FROM c WHERE c.owner_id = @owner_id"
        parameters = [{"name": "@owner_id", "value": owner_id}]
        
        opportunities_data = await self.query(query, parameters)
        return [Opportunity(**opportunity) for opportunity in opportunities_data]
    
    async def create_opportunity(self, item: Opportunity) -> Opportunity:
        """Create a new opportunity"""
        
        _dict = item.model_dump(by_alias=True)
        _created = await self.create(_dict)
        return Opportunity(**_created)
    
    async def update_opportunity(
        self,
        opportunity_id: str,
        updates: Dict[str, Any],
        owner_id: Optional[str] = None
    ) -> Optional[Opportunity]:
        """Update an existing opportunity"""
        # Verify opportunity exists and user has access
        existing = await self.get_by_id(opportunity_id, owner_id)
        if not existing:
            return None
        
        # Update the opportunity
        updated_item = await self.update(opportunity_id, updates, owner_id)
        return Opportunity(**updated_item)
    
    async def delete_opportunity(
        self,
        opportunity_id: str,
        owner_id: Optional[str] = None,
        soft_delete: bool = True
    ) -> bool:
        """Delete an opportunity (soft delete by default)"""
        # Verify opportunity exists and user has access
        existing = await self.get_by_id(opportunity_id, owner_id)
        if not existing:
            return False
        
        if soft_delete:
            # Soft delete: mark as inactive
            await self.update(opportunity_id, {"is_active": False}, opportunity_id)
        else:
            # Hard delete: remove from database
            await self.delete(opportunity_id, opportunity_id)
        
        return True
