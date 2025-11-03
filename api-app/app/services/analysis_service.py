from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging

from app.database.repositories import AnalysisRepository
from app.models import Analysis
from app.database.cosmos import CosmosDBClient


logger = logging.getLogger("app.services.analysis_service")

class AnalysisService:
    """Service layer for analysis operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        self.cosmos_client = cosmos_client
        self.analysis_repo = AnalysisRepository(cosmos_client)

    async def get_analyses(
        self,
        is_active: bool = True,
        owner_id: Optional[str] = None
    ) -> List[Analysis]:
        """Get all analyses, optionally filtered by active status and owner ID"""
        try:
            analyses = await self.analysis_repo.get_all_analyses(is_active=is_active, owner_id=owner_id)
            logger.info(f"Retrieved {len(analyses)} analyses")
            return analyses
        except Exception as e:
            logger.error(f"Error retrieving analyses: {str(e)}")
            raise
    
    async def get_analyses_by_opportunity(
        self,
        opportunity_id: str
    ) -> List[Analysis]:
        """Get all analyses for a specific opportunity"""
        try:
            analyses = await self.analysis_repo.get_by_opportunity(opportunity_id)
            logger.info(f"Retrieved {len(analyses)} analyses for opportunity {opportunity_id}")
            return analyses
        except Exception as e:
            logger.error(f"Error retrieving analyses for opportunity {opportunity_id}: {str(e)}")
            raise
    
    async def get_analysis_by_id(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: Optional[str] = None
    ) -> Optional[Analysis]:
        """Get a single analysis by ID"""
        try:
            analysis = await self.analysis_repo.get_analysis_by_id(analysis_id=analysis_id, 
                                                                   opportunity_id=opportunity_id, 
                                                                   owner_id=owner_id)
            if analysis:
                logger.info(f"Retrieved analysis {analysis_id}")
            else:
                logger.warning(f"Analysis {analysis_id} not found")
            return analysis
        except Exception as e:
            logger.error(f"Error retrieving analysis {analysis_id}: {str(e)}")
            raise
    
    async def create_analysis(
        self,
        name: str,
        opportunity_id: str,
        owner_id: str,
        investment_hypothesis: Optional[str] = None,
        tags: Optional[List[str]] = None,
        status: str = "pending"
    ) -> Analysis:
        """Create a new analysis"""
        try:
            analysis = Analysis(
                name=name,
                opportunity_id=opportunity_id,
                owner_id=owner_id,
                investment_hypothesis=investment_hypothesis,
                tags=tags or [],
                status=status,
                is_active=True
            )
            
            created_analysis = await self.analysis_repo.create_analysis(analysis)
            logger.info(f"Created analysis {created_analysis.id} for opportunity {opportunity_id}")
            return created_analysis
        except Exception as e:
            logger.error(f"Error creating analysis: {str(e)}")
            raise
    
    async def update_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str,
        name: Optional[str] = None,
        investment_hypothesis: Optional[str] = None,
        status: Optional[str] = None,
        overall_score: Optional[int] = None,
        agent_results: Optional[Dict[str, Any]] = None,
        result: Optional[str] = None,
        tags: Optional[List[str]] = None,
        started_at: Optional[str] = None,
        completed_at: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Analysis]:
        """Update an existing analysis"""
        try:
            # Build updates dictionary with only provided fields
            updates = {}
            if name is not None:
                updates["name"] = name
            if investment_hypothesis is not None:
                updates["investment_hypothesis"] = investment_hypothesis
            if status is not None:
                updates["status"] = status
            if overall_score is not None:
                updates["overall_score"] = overall_score
            if agent_results is not None:
                updates["agent_results"] = agent_results
            if result is not None:
                updates["result"] = result
            if tags is not None:
                updates["tags"] = tags
            if started_at is not None:
                updates["started_at"] = started_at
            if completed_at is not None:
                updates["completed_at"] = completed_at
            if is_active is not None:
                updates["is_active"] = is_active
            
            if not updates:
                logger.warning(f"No updates provided for analysis {analysis_id}")
                return await self.get_analysis_by_id(analysis_id=analysis_id, 
                                                     opportunity_id=opportunity_id, 
                                                     owner_id=owner_id)
            
            updated_analysis = await self.analysis_repo.update_analysis(
                analysis_id=analysis_id,
                updates=updates,
                opportunity_id=opportunity_id,
                owner_id=owner_id
            )
            
            if updated_analysis:
                logger.info(f"Updated analysis {analysis_id}")
            else:
                logger.warning(f"Analysis {analysis_id} not found or user not authorized")
            
            return updated_analysis
        except Exception as e:
            logger.error(f"Error updating analysis {analysis_id}: {str(e)}")
            raise
    
    async def delete_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str,
        soft_delete: bool = True
    ) -> bool:
        """Delete an analysis"""
        try:
            deleted = await self.analysis_repo.delete_analysis(
                analysis_id,
                owner_id,
                soft_delete
            )
            
            if deleted:
                delete_type = "soft" if soft_delete else "hard"
                logger.info(f"{delete_type} deleted analysis {analysis_id}")
            else:
                logger.warning(f"Analysis {analysis_id} not found or user not authorized")
            
            return deleted
        except Exception as e:
            logger.error(f"Error deleting analysis {analysis_id}: {str(e)}")
            raise

    async def start_analysis(
        self,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str
    ) -> Optional[Analysis]:
        """Mark an analysis as started"""
        
        logger.debug(f"Starting analysis {analysis_id} for opportunity {opportunity_id} by owner {owner_id}")
        
        try:
            updates = {
                "status": "in_progress",
                "started_at": datetime.now(timezone.utc).isoformat()
            }
            
            updated_analysis = await self.analysis_repo.update_analysis(
                analysis_id=analysis_id,
                updates=updates,
                opportunity_id=opportunity_id,
                owner_id=owner_id
            )
            
            if updated_analysis:
                logger.debug(f"Started analysis {analysis_id}")
            
            return updated_analysis
        except Exception as e:
            logger.error(f"Error starting analysis {analysis_id}: {str(e)}")
            raise
        
    
    