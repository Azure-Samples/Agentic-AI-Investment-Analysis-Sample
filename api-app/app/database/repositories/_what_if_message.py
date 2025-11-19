from typing import List, Optional, Dict, Any
from app.database.cosmos import CosmosDBClient
from app.models import WhatIfMessage, WhatIfConversation
from . import BaseRepository

class WhatIfMessageRepository(BaseRepository):
    """Repository for WhatIfMessage operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "what_if_conversations")
    
    async def get_conversation_by_id(self, conversation_id: str, analysis_id: str = None) -> Optional[WhatIfConversation]:
        """Get a single chat message by ID"""
        item = await self.get_by_id(conversation_id, analysis_id)
        if not item:
            return None
        
        return WhatIfConversation(**item)
    
    async def create_conversation(self, item: WhatIfConversation) -> WhatIfConversation:
        """Create a new conversation"""
        _dict = item.model_dump(by_alias=True)
        _created = await self.create(_dict)
        return WhatIfConversation(**_created)
    
    async def add_message_to_conversation(self, conversation_id: str, analysis_id: str, item: WhatIfMessage) -> WhatIfConversation:
        """Create a new chat message"""
        conversation = await self.get_conversation_by_id(conversation_id, analysis_id)
        if not conversation:
            raise ValueError(f"Conversation with id {conversation_id} not found")
        
        conversation.messages.append(item)
        updated_conversation = await self.update(conversation_id, conversation.model_dump(by_alias=True))
        return WhatIfConversation(**updated_conversation)

    
    async def add_message_batch_to_conversation(self, conversation_id: str, analysis_id: str, messages: List[WhatIfMessage]) -> WhatIfConversation:
        """Create multiple chat messages in batch"""
        conversation = await self.get_conversation_by_id(conversation_id, analysis_id)
        if not conversation:
            raise ValueError(f"Conversation with id {conversation_id} not found")
        
        for message in messages:
            conversation.messages.append(message)
        
        
        updated_conversation = await self.update(conversation_id, conversation.model_dump(by_alias=True), analysis_id)
        return WhatIfConversation(**updated_conversation)
    
    async def delete_message(
        self,
        message_id: str,
        conversation_id: str,
        analysis_id: str
    ) -> bool:
        """Delete a chat message"""
        # Verify message exists
        existing = await self.get_conversation_by_id(conversation_id, analysis_id)
        if not existing:
            return False
        
        existing.messages = [msg for msg in existing.messages if msg.msg_id != message_id]
        
        await self.update(conversation_id, existing.model_dump(by_alias=True), analysis_id)
        return True
    
    async def delete_conversation(self, conversation_id: str, analysis_id: str) -> bool:
        """Delete a specific conversation"""
        return await self.delete(conversation_id, analysis_id)
    
    async def list_conversations(self, analysis_id: str, page: int = 1, limit: Optional[int] = 10) -> List[WhatIfConversation]:
        """Get all conversations in the database with pagination"""
        query = "SELECT * FROM c WHERE c.analysis_id = @analysis_id ORDER BY c.created_at ASC"
        if limit:
            query += f" OFFSET @offset LIMIT @limit"
            offset = (page - 1) * limit
            parameters = [{"name": "@limit", "value": limit}, {"name": "@offset", "value": offset}, {"name": "@analysis_id", "value": analysis_id}]
        else:
            parameters = [{"name": "@analysis_id", "value": analysis_id}]
        
        conversations_data = await self.query(query, parameters)
        
        return [WhatIfConversation(**conv) for conv in conversations_data]