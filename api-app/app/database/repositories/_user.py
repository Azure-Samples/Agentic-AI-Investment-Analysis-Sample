from typing import List, Optional, Dict, Any

from app.database.cosmos import CosmosDBClient
from app.models import User
from . import BaseRepository

class UserRepository(BaseRepository):
    """Repository for User operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        super().__init__(cosmos_client, "users")
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        user_data = await self.get_opportunity_by_id(email, email)  # email is both id and partition key
        return User(**user_data) if user_data else None
    
    async def create_user(self, user: User) -> User:
        """Create a new user"""
        user_dict = user.model_dump(by_alias=True)
        user_dict["id"] = user.email  # Use email as document ID
        created_user = await self.create(user_dict)
        return User(**created_user)

