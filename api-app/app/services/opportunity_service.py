from typing import List, Optional, Dict, Any, Type
from datetime import datetime, timezone
import logging

from app.database.repositories import OpportunityRepository
from app.models import Opportunity
from app.database.cosmos import CosmosDBClient


logger = logging.getLogger("app.services.opportunity_service")

class OpportunityService:
    """Service layer for opportunity operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        self.cosmos_client = cosmos_client
        self.opportunity_repo = OpportunityRepository(cosmos_client)

    # Opportunity Methods
    async def get_opportunities(
        self,
        is_active: bool = True,
        owner_id: Optional[str] = None
    ) -> List[Opportunity]:
        """Get all opportunities, optionally filtered by active status and owner ID"""
        try:
            opportunities = await self.opportunity_repo.get_all_opportunities(is_active=is_active, owner_id=owner_id)
            logger.info(f"Retrieved {len(opportunities)} opportunities")
            return opportunities
        except Exception as e:
            logger.error(f"Error retrieving opportunities: {str(e)}")
            raise
    
    async def get_opportunity_by_id(
        self,
        opportunity_id: str,
        owner_id: Optional[str] = None
    ) -> Optional[Opportunity]:
        """Get a single opportunity by ID"""
        try:
            opportunity = await self.opportunity_repo.get_opportunity_by_id(opportunity_id, owner_id)
            if opportunity:
                logger.info(f"Retrieved opportunity {opportunity_id}")
            else:
                logger.warning(f"Opportunity {opportunity_id} not found")
            return opportunity
        except Exception as e:
            logger.error(f"Error retrieving opportunity {opportunity_id}: {str(e)}")
            raise
    
    async def create_opportunity(
        self,
        name: str,
        display_name: str,
        description: str,
        owner_id: str,
        settings: Optional[Dict[str, Any]] = None,
        is_active: bool = True
    ) -> Opportunity:
        """Create a new opportunity"""
        try:
            opportunity = Opportunity(
                name=name,
                display_name=display_name,
                description=description,
                owner_id=owner_id,
                settings=settings or {},
                is_active=is_active
            )
            
            created_opportunity = await self.opportunity_repo.create_opportunity(opportunity)
            logger.info(f"Created opportunity {created_opportunity.id}")
            return created_opportunity
        except Exception as e:
            logger.error(f"Error creating opportunity: {str(e)}")
            raise
    
    async def update_opportunity(
        self,
        opportunity_id: str,
        owner_id: str,
        display_name: Optional[str] = None,
        description: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Opportunity]:
        """Update an existing opportunity"""
        try:
            # Build updates dictionary with only provided fields
            updates = {}
            if display_name is not None:
                updates["display_name"] = display_name
            if description is not None:
                updates["description"] = description
            if settings is not None:
                updates["settings"] = settings
            if is_active is not None:
                updates["is_active"] = is_active
            
            if not updates:
                logger.warning(f"No updates provided for opportunity {opportunity_id}")
                return await self.get_opportunity_by_id(opportunity_id, owner_id)
            
            updated_opportunity = await self.opportunity_repo.update_opportunity(
                opportunity_id,
                updates,
                owner_id
            )
            
            if updated_opportunity:
                logger.info(f"Updated opportunity {opportunity_id}")
            else:
                logger.warning(f"Opportunity {opportunity_id} not found for update")
            
            return updated_opportunity
        except Exception as e:
            logger.error(f"Error updating opportunity {opportunity_id}: {str(e)}")
            logger.exception(e)
            raise
    
    async def delete_opportunity(
        self,
        opportunity_id: str,
        owner_id: str,
        soft_delete: bool = True
    ) -> bool:
        """Delete an opportunity (soft delete by default)"""
        try:
            result = await self.opportunity_repo.delete_opportunity(
                opportunity_id,
                owner_id,
                soft_delete
            )
            
            if result:
                delete_type = "soft deleted" if soft_delete else "permanently deleted"
                logger.info(f"Opportunity {opportunity_id} {delete_type}")
            else:
                logger.warning(f"Opportunity {opportunity_id} not found for deletion")
            
            return result
        except Exception as e:
            logger.error(f"Error deleting opportunity {opportunity_id}: {str(e)}")
            raise
        