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
        