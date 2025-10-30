from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

from app.database.cosmos import CosmosDBClient
from app.database.repositories import (
    UserRepository, 
)
from app.models import User

logger = logging.getLogger("app.services.user_service")


class UserService:
    """Service layer for user operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        self.cosmos_client = cosmos_client
        self.user_repo = UserRepository(cosmos_client)
    
    async def create_user(self, email: str, full_name: str = None) -> User:
        """Create a new user"""
        try:
            # Check if user already exists
            existing_user = await self.user_repo.get_by_email(email)
            if existing_user:
                raise ValueError(f"User with email {email} already exists")
            
            user = User(
                email=email,
                full_name=full_name,
                is_active=True
            )
            
            created_user = await self.user_repo.create_user(user)
            logger.info(f"Created user {email}")
            
            return created_user
            
        except Exception as e:
            logger.error(f"Error creating user {email}: {str(e)}")
            raise
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            return await self.user_repo.get_by_email(email)
        except Exception as e:
            logger.error(f"Error getting user {email}: {str(e)}")
            raise
    
    async def update_user(self, email: str, updates: Dict[str, Any]) -> Optional[User]:
        """Update user information"""
        try:
            updated_user_data = await self.user_repo.update(email, email, updates)
            return User(**updated_user_data) if updated_user_data else None
        except Exception as e:
            logger.error(f"Error updating user {email}: {str(e)}")
            raise
