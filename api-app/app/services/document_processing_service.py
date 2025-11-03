from typing import List, Optional, Dict, Any, AsyncGenerator
from datetime import datetime, timezone
import logging
import asyncio
import json

from app.database.repositories._document import DocumentRepository
from app.models import Document
from app.database.cosmos import CosmosDBClient


logger = logging.getLogger("app.services.document_processing_service")


class ProcessingStage:
    """Processing stage details"""
    TEXT_EXTRACTION = {
        "id": "text_extraction",
        "name": "Text Extraction",
        "description": "Extracting text from document",
        "progress_weight": 20
    }
    DOCUMENT_CONVERSION = {
        "id": "document_conversion",
        "name": "Document Conversion",
        "description": "Converting to structured format",
        "progress_weight": 20
    }
    CONTENT_ANALYSIS = {
        "id": "content_analysis",
        "name": "Content Analysis",
        "description": "Analyzing document content",
        "progress_weight": 20
    }
    DATA_EXTRACTION = {
        "id": "data_extraction",
        "name": "Data Extraction",
        "description": "Extracting key data points",
        "progress_weight": 20
    }
    SUMMARIZATION = {
        "id": "summarization",
        "name": "Summarization",
        "description": "Generating summary",
        "progress_weight": 20
    }
    
    @classmethod
    def get_all_stages(cls) -> List[Dict[str, Any]]:
        """Get all processing stages in order"""
        return [
            cls.TEXT_EXTRACTION,
            cls.DOCUMENT_CONVERSION,
            cls.CONTENT_ANALYSIS,
            cls.DATA_EXTRACTION,
            cls.SUMMARIZATION
        ]


class DocumentProcessingService:
    """Service for handling document processing workflow"""
    
    def __init__(self, cosmos_client: CosmosDBClient):
        self.cosmos_client = cosmos_client
        self.document_repo = DocumentRepository(cosmos_client)
    
    async def start_processing(
        self,
        document_ids: List[str],
        opportunity_id: str
    ) -> Dict[str, Any]:
        """
        Start processing multiple documents
        
        Args:
            document_ids: List of document IDs to process
            opportunity_id: ID of the opportunity
            
        Returns:
            Dict with processing job details
        """
        try:
            # Validate documents exist and belong to opportunity
            documents = []
            for doc_id in document_ids:
                doc = await self.document_repo.get_opportunity_by_id(doc_id, opportunity_id)
                if not doc:
                    logger.warning(f"Document {doc_id} not found or doesn't belong to opportunity {opportunity_id}")
                    continue
                documents.append(doc)
            
            if not documents:
                raise ValueError("No valid documents found to process")
            
            # Mark documents as pending processing
            for doc in documents:
                await self._update_document_status(
                    doc.id,
                    opportunity_id,
                    status="pending",
                    progress=0
                )
            
            logger.info(f"Started processing {len(documents)} documents for opportunity {opportunity_id}")
            
            return {
                "job_id": f"job_{opportunity_id}_{datetime.now(timezone.utc).timestamp()}",
                "document_count": len(documents),
                "document_ids": [doc.id for doc in documents],
                "status": "started",
                "started_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error starting document processing: {str(e)}")
            raise
    
    async def process_documents_stream(
        self,
        document_ids: List[str],
        opportunity_id: str
    ) -> AsyncGenerator[str, None]:
        """
        Process documents and stream progress events via SSE
        
        Args:
            document_ids: List of document IDs to process
            opportunity_id: ID of the opportunity
            
        Yields:
            SSE formatted event strings
        """
        try:
            # Validate documents
            documents = []
            for doc_id in document_ids:
                doc = await self.document_repo.get_opportunity_by_id(doc_id, opportunity_id)
                if not doc:
                    yield self._format_sse_event({
                        "type": "error",
                        "document_id": doc_id,
                        "message": f"Document {doc_id} not found"
                    })
                    continue
                documents.append(doc)
            
            if not documents:
                yield self._format_sse_event({
                    "type": "error",
                    "message": "No valid documents found to process"
                })
                return
            
            # Send start event
            yield self._format_sse_event({
                "type": "processing_started",
                "document_count": len(documents),
                "document_ids": [doc.id for doc in documents],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            # Process each document
            for idx, document in enumerate(documents):
                yield self._format_sse_event({
                    "type": "document_started",
                    "document_id": document.id,
                    "document_name": document.name,
                    "document_index": idx,
                    "total_documents": len(documents),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
                # Process through all stages
                async for event in self._process_single_document(document, opportunity_id):
                    yield event
                
                yield self._format_sse_event({
                    "type": "document_completed",
                    "document_id": document.id,
                    "document_name": document.name,
                    "document_index": idx,
                    "total_documents": len(documents),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            # Send completion event
            yield self._format_sse_event({
                "type": "processing_completed",
                "document_count": len(documents),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error in document processing stream: {str(e)}")
            yield self._format_sse_event({
                "type": "error",
                "message": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    async def _process_single_document(
        self,
        document: Document,
        opportunity_id: str
    ) -> AsyncGenerator[str, None]:
        """
        Process a single document through all stages
        
        Args:
            document: Document to process
            opportunity_id: ID of the opportunity
            
        Yields:
            SSE formatted event strings
        """
        try:
            # Update status to processing
            await self._update_document_status(
                document.id,
                opportunity_id,
                status="processing",
                progress=0,
                started_at=datetime.now(timezone.utc).isoformat()
            )
            
            stages = ProcessingStage.get_all_stages()
            total_progress = 0
            
            for stage_idx, stage in enumerate(stages):
                # Send stage started event
                yield self._format_sse_event({
                    "type": "stage_started",
                    "document_id": document.id,
                    "stage_id": stage["id"],
                    "stage_name": stage["name"],
                    "stage_description": stage["description"],
                    "stage_index": stage_idx,
                    "total_stages": len(stages),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
                # Simulate stage processing with progress updates
                stage_progress_steps = 5
                for step in range(stage_progress_steps + 1):
                    await asyncio.sleep(0.8)  # Simulate processing time
                    
                    step_progress = (step / stage_progress_steps) * stage["progress_weight"]
                    current_progress = total_progress + step_progress
                    
                    # Update document progress
                    await self._update_document_status(
                        document.id,
                        opportunity_id,
                        progress=int(current_progress)
                    )
                    
                    yield self._format_sse_event({
                        "type": "stage_progress",
                        "document_id": document.id,
                        "stage_id": stage["id"],
                        "stage_name": stage["name"],
                        "stage_progress": int((step / stage_progress_steps) * 100),
                        "overall_progress": int(current_progress),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                
                total_progress += stage["progress_weight"]
                
                # Send stage completed event
                yield self._format_sse_event({
                    "type": "stage_completed",
                    "document_id": document.id,
                    "stage_id": stage["id"],
                    "stage_name": stage["name"],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            # Mark document as completed
            await self._update_document_status(
                document.id,
                opportunity_id,
                status="completed",
                progress=100,
                completed_at=datetime.now(timezone.utc).isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error processing document {document.id}: {str(e)}")
            
            # Update document with error
            await self._update_document_status(
                document.id,
                opportunity_id,
                status="error",
                error=str(e)
            )
            
            yield self._format_sse_event({
                "type": "error",
                "document_id": document.id,
                "message": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    async def _update_document_status(
        self,
        document_id: str,
        opportunity_id: str,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        started_at: Optional[str] = None,
        completed_at: Optional[str] = None,
        error: Optional[str] = None
    ) -> None:
        """Update document processing status"""
        updates = {}
        
        if status is not None:
            updates["processing_status"] = status
        if progress is not None:
            updates["processing_progress"] = progress
        if started_at is not None:
            updates["processing_started_at"] = started_at
        if completed_at is not None:
            updates["processing_completed_at"] = completed_at
        if error is not None:
            updates["processing_error"] = error
        
        if updates:
            await self.document_repo.update_document(document_id, updates, opportunity_id)
    
    def _format_sse_event(self, data: Dict[str, Any]) -> str:
        """Format data as SSE event"""
        return f"data: {json.dumps(data)}\n\n"
    
    async def get_processing_status(
        self,
        document_id: str,
        opportunity_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get current processing status of a document"""
        try:
            document = await self.document_repo.get_opportunity_by_id(document_id, opportunity_id)
            if not document:
                return None
            
            return {
                "document_id": document.id,
                "document_name": document.name,
                "status": document.processing_status,
                "progress": document.processing_progress,
                "started_at": document.processing_started_at,
                "completed_at": document.processing_completed_at,
                "error": document.processing_error
            }
        except Exception as e:
            logger.error(f"Error getting processing status for document {document_id}: {str(e)}")
            raise
