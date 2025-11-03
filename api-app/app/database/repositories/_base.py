from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from azure.cosmos.container import ContainerProxy
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from app.database.cosmos import CosmosDBClient

class BaseRepository:
    """Base repository class for common Cosmos DB operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient, container_name: str):
        self.cosmos_client = cosmos_client
        self.container_name = container_name
        self.container: ContainerProxy = cosmos_client.get_container(container_name)
    
    async def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        item["created_at"] = datetime.now(timezone.utc).isoformat()
        item["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        if "id" not in item:
            item["id"] = str(uuid.uuid4())
            
        response = await self.container.create_item(body=item)
        return response
    
    async def get_by_id(self, item_id: str, partition_key: str = None) -> Optional[Dict[str, Any]]:
        """Get document by ID and partition key"""
        try:
            response = await self.container.read_item(
                item=item_id,
                partition_key=partition_key or item_id
            )
            return response
        except CosmosResourceNotFoundError:
            return None

    async def update(self, item_id: str, updates: Dict[str, Any], partition_key: str = None) -> Dict[str, Any]:
        """Update a document"""
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Get existing item
        existing_item = await self.get_by_id(item_id, partition_key)
        if not existing_item:
            raise ValueError(f"Item with id {item_id}, partition key {partition_key} not found")
        
        # Merge updates
        existing_item.update(updates)
        
        response = await self.container.replace_item(
            item=item_id,
            body=existing_item
        )
        return response
    
    async def upsert(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Update a document"""
        item["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        response = await self.container.upsert_item(
            body=item
        )
        return response
    
    async def delete(self, item_id: str, partition_key: str) -> bool:
        """Delete a document"""
        try:
            await self.container.delete_item(
                item=item_id,
                partition_key=partition_key
            )
            return True
        except CosmosResourceNotFoundError:
            return False
    
    async def query(self, query: str, parameters: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute a SQL query"""
        items = []
        async for item in self.container.query_items(
            query=query,
            parameters=parameters or []
        ):
            items.append(item)
        
        return items
