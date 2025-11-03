from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging
import mimetypes
import os

from app.database.repositories._document import DocumentRepository
from app.models import Document
from app.database.cosmos import CosmosDBClient
from app.utils.blob_storage import BlobStorageService


logger = logging.getLogger("app.services.document_service")

class DocumentService:
    """Service layer for document operations"""
    
    def __init__(self, cosmos_client: CosmosDBClient, blob_storage: BlobStorageService):
        self.cosmos_client = cosmos_client
        self.blob_storage = blob_storage
        self.document_repo = DocumentRepository(cosmos_client)
    
    async def get_documents_by_opportunity(self, opportunity_id: str) -> List[Document]:
        """Get all documents for a specific opportunity"""
        try:
            documents = await self.document_repo.get_by_opportunity(opportunity_id)
            logger.info(f"Retrieved {len(documents)} documents for opportunity {opportunity_id}")
            return documents
        except Exception as e:
            logger.error(f"Error retrieving documents for opportunity {opportunity_id}: {str(e)}")
            raise
    
    
    async def get_document_by_id(
        self,
        document_id: str,
        opportunity_id: Optional[str] = None
    ) -> Optional[Document]:
        """Get a single document by ID"""
        try:
            document = await self.document_repo.get_document_by_id(document_id, opportunity_id)
            if document:
                logger.debug(f"Retrieved document {document_id}")
            else:
                logger.warning(f"Document {document_id} not found")
            return document
        except Exception as e:
            logger.error(f"Error retrieving document {document_id}: {str(e)}")
            raise
    
    
    async def _file_exists(self, file_name: str) -> bool:
        """Check if a file exists in cosmos"""
        existing = await self.document_repo.get_by_file_name(file_name, file_name)
        return existing is not None
    
    async def upload_document(
        self,
        file_content: bytes,
        filename: str,
        opportunity_id: str,
        opportunity_name: str,
        content_type: Optional[str] = None,
        uploaded_by: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Document:
        """
        Upload a document to blob storage and create a database record
        
        Args:
            file_content: Binary content of the file
            filename: Original filename
            opportunity_id: ID of the associated opportunity
            content_type: MIME type of the file
            uploaded_by: User ID of the uploader
            tags: Optional tags for categorization
            
        Returns:
            Document: Created document record
        """
        
        try:
            existing = await self.document_repo.get_by_file_name(filename, opportunity_id) 
            if existing:
                raise ValueError(f"Document with name {filename} already exists for opportunity {opportunity_id}")
            
            # Determine MIME type if not provided
            if not content_type:
                content_type, _ = mimetypes.guess_type(filename)
                if not content_type:
                    content_type = "application/octet-stream"
            
            # Extract file extension
            file_extension = os.path.splitext(filename)[1].lstrip('.')
            if not file_extension:
                file_extension = "unknown"
            
            file_path = self._get_blob_path(opportunity_name, filename)
            
            # Upload to blob storage
            blob_url = await self.blob_storage.upload_file(
                file_content=file_content,
                blob_name=file_path,
                content_type=content_type
            )
            
            # Create document record in database
            document = Document(
                name=filename,
                opportunity_id=opportunity_id,
                opportunity_name=opportunity_name,
                file_url=blob_url,
                file_type=file_extension,
                mime_type=content_type,
                size=len(file_content),
                uploaded_by=uploaded_by,
                tags=tags or []
            )
            
            created_document = await self.document_repo.create_document(document)
            logger.info(f"Uploaded and created document {created_document.id} for opportunity {opportunity_id}")
            
            return created_document
            
        except Exception as e:
            logger.error(f"Error uploading document {filename}: {str(e)}")
            raise
    
    
    async def update_document_tags(
        self,
        document_id: str,
        opportunity_id: str,
        tags: Optional[List[str]] = None,
    ) -> Optional[Document]:
        """Update an existing document"""
        try:
            # Build updates dictionary with only provided fields
            updates = {}

            if tags is not None:
                updates["tags"] = tags

            if not updates:
                logger.warning(f"No updates provided for document {document_id}")
                return await self.get_document_by_id(document_id, opportunity_id)
            
            updated_document = await self.document_repo.update_document(
                document_id,
                updates,
                opportunity_id
            )
            
            if updated_document:
                logger.info(f"Updated document {document_id}")
            else:
                logger.warning(f"Document {document_id} not found for update")
            
            return updated_document
        except Exception as e:
            logger.error(f"Error updating document {document_id}: {str(e)}")
            raise
    
    async def delete_document(
        self,
        document_id: str,
        opportunity_id: Optional[str] = None,
        opportunity_name: Optional[str] = None
    ) -> bool:
        """Delete a document and its file from blob storage"""
        try:
            # Get the document to retrieve blob name
            document = await self.get_document_by_id(document_id, opportunity_id)
            if not document:
                logger.warning(f"Document {document_id} not found for deletion")
                return False
            
            # Delete from blob storage
            blob_name = self._get_blob_path(opportunity_name, document.name)
            if blob_name:
                try:
                    await self.blob_storage.delete_file(blob_name)
                except Exception as blob_error:
                    logger.warning(f"Could not delete blob {blob_name}: {str(blob_error)}")
                    # Continue with database deletion even if blob deletion fails
            
            # Delete from database
            result = await self.document_repo.delete_document(
                document_id,
                opportunity_id
            )
            
            if result:
                logger.info(f"Deleted document {document_id}")
            else:
                logger.warning(f"Document {document_id} not found for deletion")
            
            return result
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {str(e)}")
            raise
    
    async def delete_documents_by_opportunity(self, opportunity_id: str) -> int:
        """Delete all documents for a specific opportunity"""
        try:
            # Delete all blobs for this opportunity
            try:
                blob_prefix = f"opportunities/{opportunity_id}/"
                await self.blob_storage.delete_files_by_prefix(blob_prefix)
            except Exception as blob_error:
                logger.warning(f"Error deleting blobs for opportunity {opportunity_id}: {str(blob_error)}")
                # Continue with database deletion even if blob deletion fails
            
            # Delete from database
            count = await self.document_repo.delete_documents_by_opportunity(opportunity_id)
            logger.info(f"Deleted {count} documents for opportunity {opportunity_id}")
            return count
        except Exception as e:
            logger.error(f"Error deleting documents for opportunity {opportunity_id}: {str(e)}")
            raise
    
    async def get_document_download_url(
        self,
        document_id: str,
        opportunity_id: Optional[str] = None,
        expiry_hours: int = 1
    ) -> Optional[str]:
        """
        Get a download URL for a document
        
        Args:
            document_id: ID of the document
            opportunity_id: Optional opportunity ID for verification
            expiry_hours: Hours until the download URL expires
            
        Returns:
            str: Download URL or None if document not found
        """
        try:
            document = await self.document_repo.get_opportunity_by_id(document_id, opportunity_id)
            if not document:
                logger.warning(f"Document {document_id} not found")
                return None
            
            # Extract blob name from URL
            blob_name = self._extract_blob_name_from_url(document.file_url)
            if not blob_name:
                logger.error(f"Could not extract blob name from URL: {document.file_url}")
                return document.file_url  # Return original URL as fallback
            
            # Generate download URL
            download_url = self.blob_storage.generate_download_url(blob_name, expiry_hours)
            logger.info(f"Generated download URL for document {document_id}")
            
            return download_url
            
        except Exception as e:
            logger.error(f"Error generating download URL for document {document_id}: {str(e)}")
            raise
    
    def _get_blob_path(self, opportunity_name: str, filename: str) -> str:
            """Generate a blob path with opportunity name as prefix"""
            # Sanitize filename
            safe_filename = filename.replace(" ", "_").replace("\\", "/")
            safe_opportunity_name = opportunity_name.replace(" ", "_").replace("\\", "/")
            # Create path: opportunities/{opportunity_name}/{filename}
            return f"opportunities/{safe_opportunity_name}/{safe_filename}"
    
    def _extract_blob_name_from_url(self, blob_url: str) -> Optional[str]:
        """
        Extract blob name from blob URL
        
        Example:
            https://storageaccount.blob.core.windows.net/container/path/to/blob
            Returns: path/to/blob
        """
        try:
            from app.core.config import settings
            container_name = settings.AZURE_STORAGE_CONTAINER_NAME
            
            # Find container name in URL and extract everything after it
            container_index = blob_url.find(f"/{container_name}/")
            if container_index != -1:
                # Extract blob name (everything after /{container}/)
                blob_name = blob_url[container_index + len(f"/{container_name}/"):]
                # Remove SAS token if present
                blob_name = blob_name.split('?')[0]
                return blob_name
            
            return None
        except Exception as e:
            logger.error(f"Error extracting blob name from URL {blob_url}: {str(e)}")
            return None
    
    async def update_processing_status(
        self,
        document_id: str,
        opportunity_id: str,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        started_at: Optional[str] = None,
        completed_at: Optional[str] = None,
        error: Optional[str] = None,
        stages: Optional[Dict[str, Any]] = None
    ) -> Optional[Document]:
        """
        Update document processing status
        
        Args:
            document_id: ID of the document
            opportunity_id: ID of the opportunity
            status: Processing status (pending, processing, completed, error)
            progress: Progress percentage (0-100)
            started_at: Processing start timestamp
            completed_at: Processing completion timestamp
            error: Error message if processing failed
            stages: Dictionary of processing stage statuses
            
        Returns:
            Updated document or None if not found
        """
        try:
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
            if stages is not None:
                updates["processing_stages"] = stages
            
            if not updates:
                logger.warning(f"No processing status updates provided for document {document_id}")
                return await self.get_document_by_id(document_id, opportunity_id)
            
            updated_document = await self.document_repo.update_document(
                document_id,
                updates,
                opportunity_id
            )
            
            if updated_document:
                logger.info(f"Updated processing status for document {document_id}")
            else:
                logger.warning(f"Document {document_id} not found for processing status update")
            
            return updated_document
            
        except Exception as e:
            logger.error(f"Error updating processing status for document {document_id}: {str(e)}")
            raise
    
    async def get_processing_statistics(self, opportunity_id: str) -> Dict[str, Any]:
        """
        Get processing statistics for all documents in an opportunity
        
        Args:
            opportunity_id: ID of the opportunity
            
        Returns:
            Dictionary with processing statistics
        """
        try:
            documents = await self.get_documents_by_opportunity(opportunity_id)
            
            total_documents = len(documents)
            pending_count = sum(1 for doc in documents if doc.processing_status == "pending")
            processing_count = sum(1 for doc in documents if doc.processing_status == "processing")
            completed_count = sum(1 for doc in documents if doc.processing_status == "completed")
            error_count = sum(1 for doc in documents if doc.processing_status == "error")
            
            return {
                "opportunity_id": opportunity_id,
                "total_documents": total_documents,
                "pending": pending_count,
                "processing": processing_count,
                "completed": completed_count,
                "error": error_count,
                "completion_rate": (completed_count / total_documents * 100) if total_documents > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting processing statistics for opportunity {opportunity_id}: {str(e)}")
            raise
