from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from . import BaseRepository

class AnalysisRepository(BaseRepository):
    """Repository for Analysis operations"""

    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "analysis")

    async def get_by_opportunity(self, opportunity_id: str) -> List[Analysis]:
        """Get all analysis for a specific opportunity_id"""
        
        query = "SELECT * FROM c WHERE c.opportunity_id = @opportunity_id"
        parameters = [{"name": "@opportunity_id", "value": opportunity_id}]
        
        _data = await self.query(query, parameters)
        return [Analysis(**doc) for doc in _data]
    
    async def create_analysis(self, item: Analysis) -> Analysis:
        """Create a new opportunity"""

        _dict = item.model_dump(by_alias=True)
        _created = await self.create(_dict)
        return Analysis(**_created)
