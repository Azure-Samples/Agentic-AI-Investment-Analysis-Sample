from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from app.models import Document
from . import BaseRepository

class DocumentRepository(BaseRepository):
    """Repository for Document operations"""

    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "documents")
    
    
    async def get_document_by_id(self, document_id: str, opportunity_id: Optional[str] = None) -> Optional[Document]:
        """Get a single document by ID"""
        
        item = await self.get_by_id(document_id, opportunity_id)
        if not item:
            return None
        
        document = Document(**item)
        return document
    
    async def get_by_file_name(self, filename:str, opportunity_id:str) -> Optional[Document]:
        """Get a document by its file path and opportunity ID"""
        
        query = "SELECT * FROM c WHERE c.name = @filename"
        parameters = [{"name": "@filename", "value": filename}]
        
        if opportunity_id:
            query += " AND c.opportunity_id = @opportunity_id"
            parameters.append({"name": "@opportunity_id", "value": opportunity_id})
        
        documents_data = await self.query(query, parameters)
        if not documents_data:
            return None
        
        return Document(**documents_data[0])
    
    async def get_by_opportunity(self, opportunity_id: str) -> List[Document]:
        """Get all documents for a specific opportunity_id"""
        
        query = "SELECT * FROM c WHERE c.opportunity_id = @opportunity_id ORDER BY c.created_at DESC"
        parameters = [{"name": "@opportunity_id", "value": opportunity_id}]
        
        documents_data = await self.query(query, parameters)
        return [Document(**doc) for doc in documents_data]
    
    
    async def create_document(self, item: Document) -> Document:
        """Create a new document"""
        
        _dict = item.model_dump(by_alias=True)
        _created = await self.create(_dict)
        return Document(**_created)
    
    
    async def update_document(
        self,
        document_id: str,
        updates: Dict[str, Any],
        opportunity_id: Optional[str] = None
    ) -> Optional[Document]:
        """Update an existing document"""

        # Update the document
        updated_item = await self.update(document_id, updates, opportunity_id)
        return Document(**updated_item)
    
    async def delete_document(
        self,
        document_id: str,
        opportunity_id: Optional[str] = None
    ) -> bool:
        """Delete a document"""
        # Verify document exists and belongs to opportunity
        existing = await self.get_by_id(document_id, opportunity_id)
        if not existing:
            return False
        
        # Hard delete document
        result = await self.delete(document_id, opportunity_id)
        return result
    
    async def delete_documents_by_opportunity(self, opportunity_id: str) -> int:
        """Delete all documents for a specific opportunity"""
        documents = await self.get_by_opportunity(opportunity_id)
        deleted_count = 0
        
        for doc in documents:
            if await self.delete(doc.id, opportunity_id):
                deleted_count += 1
        
        return deleted_count
