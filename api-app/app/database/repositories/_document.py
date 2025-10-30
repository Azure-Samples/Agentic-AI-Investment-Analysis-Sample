from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from . import BaseRepository

class DocumentRepository(BaseRepository):
    """Repository for Document operations"""

    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "documents")

    async def get_by_opportunity(self, opportunity_id: str) -> List[Document]:
        """Get all documents for a specific opportunity_id"""
        
        query = "SELECT * FROM c WHERE c.opportunity_id = @opportunity_id"
        parameters = [{"name": "@opportunity_id", "value": opportunity_id}]
        
        documents_data = await self.query(query, parameters)
        return [Document(**doc) for doc in documents_data]
    
    async def create_document(self, item: Document) -> Document:
        """Create a new opportunity"""
        
        _dict = item.model_dump(by_alias=True)
        _created = await self.create(_dict)
        return Document(**_created)
