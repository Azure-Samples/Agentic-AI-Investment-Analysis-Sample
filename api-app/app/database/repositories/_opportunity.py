from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from . import BaseRepository

from app.models import Opportunity

class OpportunityRepository(BaseRepository):
    """Repository for Opportunity operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "opportunities")
    
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
