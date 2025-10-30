from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

from app.core.auth import get_current_active_user
from app.services.opportunity_service import OpportunityService
from app.dependencies import get_opportunity_service
from app.models import Opportunity, User

router = APIRouter(prefix="/opportunity", tags=["opportunity"])

# region Models

class OpportunityResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    category: str
    icon: Optional[str] = None
    owner_id: str
    settings: Dict[str, Any] = {}
    tags: List[str] = []
    is_active: bool = True
    created_at: str
    updated_at: str

    @classmethod
    def from_opportunity(cls, opportunity: Opportunity) -> "OpportunityResponse":
        return cls(
            id=opportunity.id,
            name=opportunity.name,
            display_name=opportunity.display_name,
            category=opportunity.category,
            icon=opportunity.icon,
            owner_id=opportunity.owner_id,
            settings=opportunity.settings,
            tags=opportunity.tags,
            is_active=opportunity.is_active,
            created_at=opportunity.created_at,
            updated_at=opportunity.updated_at
        )

# region Endpoints

@router.get("/opportunities", response_model=List[OpportunityResponse])
async def get_opportunities(
    is_active: bool = Query(True, description="Filter by active status"),
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service)
):
    """Get all opportunities with optional filtering"""
    try:
        opportunities = await opportunity_service.get_opportunities(is_active=is_active, owner_id=current_user.email)
        return [OpportunityResponse.from_opportunity(opportunity) for opportunity in opportunities]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve opportunities: {str(e)}"
        )
