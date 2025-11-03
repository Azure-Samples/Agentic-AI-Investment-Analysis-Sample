from fastapi import APIRouter, Depends, Form, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from typing import Annotated, List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
import os
import logging

from app.core.auth import get_current_active_user
from app.services.opportunity_service import OpportunityService
from app.services.document_service import DocumentService
from app.services.document_processing_service import DocumentProcessingService
from app.dependencies import get_opportunity_service, get_document_service, get_document_processing_service
from app.models import Opportunity, Document, User

router = APIRouter(prefix="/opportunity", tags=["opportunity"])

logger = logging.getLogger("app.routers.opportunity")

# region Models

class OpportunityResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    owner_id: str
    settings: Dict[str, Any] = {}
    is_active: bool = True
    created_at: str
    updated_at: str

    @classmethod
    def from_opportunity(cls, opportunity: Opportunity) -> "OpportunityResponse":
        return cls(
            id=opportunity.id,
            name=opportunity.name,
            display_name=opportunity.display_name,
            description=opportunity.description,
            owner_id=opportunity.owner_id,
            settings=opportunity.settings,
            is_active=opportunity.is_active,
            created_at=opportunity.created_at,
            updated_at=opportunity.updated_at
        )


class OpportunityCreateRequest(BaseModel):
    name: str = Field(..., description="Unique identifier name for the opportunity")
    display_name: str = Field(..., description="Display name for the opportunity")
    description: str = Field(..., description="Description of the opportunity")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Settings for the opportunity")
    is_active: bool = Field(True, description="Whether the opportunity is active")


class OpportunityUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, description="Display name for the opportunity")
    description: Optional[str] = Field(None, description="Description of the opportunity")
    settings: Optional[Dict[str, Any]] = Field(None, description="Settings for the opportunity")
    is_active: Optional[bool] = Field(None, description="Whether the opportunity is active")


class DocumentResponse(BaseModel):
    id: str
    name: str
    tags: List[str] = []
    opportunity_id: str
    file_url: str
    file_type: str
    mime_type: str
    size: int
    uploaded_at: str
    uploaded_by: Optional[str] = None
    created_at: str
    updated_at: str
    processing_status: str = "pending"
    processing_progress: int = 0
    processing_started_at: Optional[str] = None
    processing_completed_at: Optional[str] = None
    processing_error: Optional[str] = None

    @classmethod
    def from_document(cls, document: Document) -> "DocumentResponse":
        return cls(
            id=document.id,
            name=document.name,
            tags=document.tags,
            opportunity_id=document.opportunity_id,
            file_url=document.file_url,
            file_type=document.file_type,
            mime_type=document.mime_type,
            size=document.size,
            uploaded_at=document.uploaded_at,
            uploaded_by=document.uploaded_by,
            created_at=document.created_at,
            updated_at=document.updated_at,
            processing_status=document.processing_status,
            processing_progress=document.processing_progress,
            processing_started_at=document.processing_started_at,
            processing_completed_at=document.processing_completed_at,
            processing_error=document.processing_error
        )


class DocumentCreateRequest(BaseModel):
    name: str = Field(..., description="Name of the document")
    file_url: str = Field(..., description="URL or path to the document file")
    file_type: str = Field(..., description="File type (e.g., 'pdf', 'docx')")
    mime_type: str = Field(..., description="MIME type of the file")
    size: int = Field(..., description="Size of the file in bytes")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")


class DocumentUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, description="Name of the document")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")


class ProcessDocumentsRequest(BaseModel):
    document_ids: List[str] = Field(..., description="List of document IDs to process")


class ProcessingJobResponse(BaseModel):
    job_id: str
    document_count: int
    document_ids: List[str]
    status: str
    started_at: str


# endregion

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


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service)
):
    """Get a single opportunity by ID"""
    try:
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        return OpportunityResponse.from_opportunity(opportunity)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve opportunity: {str(e)}"
        )


@router.post("/opportunities", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    request: OpportunityCreateRequest,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service)
):
    """Create a new opportunity"""
    try:
        opportunity = await opportunity_service.create_opportunity(
            name=request.name,
            display_name=request.display_name,
            description=request.description,
            owner_id=current_user.email,
            settings=request.settings,
            is_active=request.is_active
        )
        
        return OpportunityResponse.from_opportunity(opportunity)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create opportunity: {str(e)}"
        )


@router.put("/opportunities/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opportunity_id: str,
    request: OpportunityUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service)
):
    """Update an existing opportunity"""
    try:
        opportunity = await opportunity_service.update_opportunity(
            opportunity_id=opportunity_id,
            owner_id=current_user.email,
            display_name=request.display_name,
            description=request.description,
            settings=request.settings,
            is_active=request.is_active
        )
        
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        return OpportunityResponse.from_opportunity(opportunity)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update opportunity: {str(e)}"
        )


@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(
    opportunity_id: str,
    permanent: bool = Query(False, description="Permanently delete (true) or soft delete (false)"),
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service)
):
    """Delete an opportunity (soft delete by default)"""
    try:
        result = await opportunity_service.delete_opportunity(
            opportunity_id=opportunity_id,
            owner_id=current_user.email,
            soft_delete=not permanent
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete opportunity: {str(e)}"
        )


# endregion

# region Document Endpoints

@router.get("/opportunities/{opportunity_id}/documents", response_model=List[DocumentResponse])
async def get_opportunity_documents(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get all documents for a specific opportunity"""
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        documents = await document_service.get_documents_by_opportunity(opportunity_id)
        return [DocumentResponse.from_document(doc) for doc in documents]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve documents: {str(e)}"
        )


@router.get("/opportunities/{opportunity_id}/documents/{document_id}", response_model=DocumentResponse)
async def get_opportunity_document(
    opportunity_id: str,
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get a specific document for an opportunity"""
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        document = await document_service.get_document_by_id(document_id, opportunity_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        return DocumentResponse.from_document(document)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document: {str(e)}"
        )


@router.post("/opportunities/{opportunity_id}/documents/upload", response_model=List[DocumentResponse], status_code=status.HTTP_201_CREATED)
async def upload_opportunity_documents_with_metadata(
    opportunity_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    document_service: DocumentService = Depends(get_document_service)
):
    """
    Upload documents with per-file metadata (including tags).
    
    This endpoint accepts multipart/form-data with the following fields:
    - files: Multiple file uploads
    - tags_0: Comma-separated tags for first file (optional)
    - tags_1: Comma-separated tags for second file (optional)
    - tags_N: Comma-separated tags for Nth file (optional)
    
    Example using curl:
    ```
    curl -X POST \\
      -F "files=@doc1.pdf" \\
      -F "files=@doc2.xlsx" \\
      -F "tags_0=financial,2024" \\
      -F "tags_1=report,quarterly" \\
      https://api.../opportunities/{id}/documents/upload
    ```
    """
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )

        # Parse form data manually to handle files and tags
        form = await request.form()
        
        print("In function: upload_opportunity_documents_with_metadata")
        print(form)
        
        # Extract files
        files = form.getlist("files")
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )
        
        # Extract tags for each file
        tags_dict = {}
        for key, value in form.items():
            if key.startswith("tags_"):
                try:
                    index = int(key.split("_")[1])
                    # Parse comma-separated tags
                    tags_dict[index] = [tag.strip() for tag in value.split(',') if tag.strip()]
                except (IndexError, ValueError):
                    logger.warning(f"Invalid tag field format: {key}")
        
        # Allowed file extensions
        allowed_extensions = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'}
        max_size = 100 * 1024 * 1024  # 100MB per file
        
        uploaded_documents = []
        errors = []
        
        # Process each file
        for idx, file in enumerate(files):
            try:
                # Validate file has a filename
                if not hasattr(file, 'filename') or not file.filename:
                    errors.append({
                        "file_index": idx,
                        "filename": "unknown",
                        "error": "No filename provided"
                    })
                    continue
                
                # Validate file extension
                file_ext = os.path.splitext(file.filename)[1].lower()
                if file_ext not in allowed_extensions:
                    errors.append({
                        "file_index": idx,
                        "filename": file.filename,
                        "error": f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_extensions)}"
                    })
                    continue
                
                # Read file content
                file_content = await file.read()
                
                # Validate file size
                if len(file_content) > max_size:
                    errors.append({
                        "file_index": idx,
                        "filename": file.filename,
                        "error": f"File size {len(file_content) / (1024 * 1024):.2f}MB exceeds maximum allowed size of {max_size / (1024 * 1024)}MB"
                    })
                    continue
                
                # Get tags for this specific file
                tag_list = tags_dict.get(idx, [])
                
                # Upload document
                document = await document_service.upload_document(
                    file_content=file_content,
                    filename=file.filename,
                    opportunity_id=opportunity.id,
                    opportunity_name=opportunity.name,
                    content_type=getattr(file, 'content_type', None),
                    uploaded_by=current_user.email,
                    tags=tag_list
                )
                
                uploaded_documents.append(document)
                
            except Exception as file_error:
                errors.append({
                    "file_index": idx,
                    "filename": file.filename if hasattr(file, 'filename') else "unknown",
                    "error": str(file_error)
                })
        
        # If no files were successfully uploaded, return error
        if len(uploaded_documents) == 0:
            error_details = {
                "message": f"Failed to upload any files: {[error['error'] for error in errors]}",
                "errors": errors
            }
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_details
            )
        
        # Return successful uploads (with errors as warning if partial success)
        response = [DocumentResponse.from_document(doc) for doc in uploaded_documents]
        
        # If there were some errors, log them but return successful uploads
        if errors:
            logger.warning(f"Partial upload success. {len(uploaded_documents)} succeeded, {len(errors)} failed. Errors: {errors}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload documents: {str(e)}"
        )


@router.get("/opportunities/{opportunity_id}/documents/{document_id}/download")
async def get_document_download_url(
    opportunity_id: str,
    document_id: str,
    expiry_hours: int = Query(1, ge=1, le=24, description="Hours until download link expires"),
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get a download URL for a document"""
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        download_url = await document_service.get_document_download_url(
            document_id,
            opportunity_id,
            expiry_hours
        )
        
        if not download_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        return {"download_url": download_url, "expires_in_hours": expiry_hours}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


@router.put("/opportunities/{opportunity_id}/documents/{document_id}", response_model=DocumentResponse)
async def update_opportunity_document_tags(
    opportunity_id: str,
    document_id: str,
    request: DocumentUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    document_service: DocumentService = Depends(get_document_service)
):
    """Update a document for an opportunity"""
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        document = await document_service.update_document_tags(
            document_id=document_id,
            opportunity_id=opportunity.id,
            tags=request.tags
        )
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        return DocumentResponse.from_document(document)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update document: {str(e)}"
        )


@router.delete("/opportunities/{opportunity_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity_document(
    opportunity_id: str,
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    document_service: DocumentService = Depends(get_document_service)
):
    """Delete a document from an opportunity"""
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        result = await document_service.delete_document(document_id, opportunity_id, opportunity_name=opportunity.name)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )


# endregion

# region Document Processing Endpoints

@router.post("/opportunities/{opportunity_id}/documents/process", response_model=ProcessingJobResponse)
async def start_document_processing(
    opportunity_id: str,
    request: ProcessDocumentsRequest,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    processing_service: DocumentProcessingService = Depends(get_document_processing_service)
):
    """
    Start processing selected documents for an opportunity.
    This endpoint starts the processing job and returns immediately with a job ID.
    Use the SSE endpoint to monitor progress.
    """
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        # Validate request
        if not request.document_ids or len(request.document_ids) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No document IDs provided"
            )
        
        # Start processing
        job = await processing_service.start_processing(
            document_ids=request.document_ids,
            opportunity_id=opportunity_id
        )
        
        return ProcessingJobResponse(**job)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start document processing: {str(e)}"
        )


@router.get("/opportunities/{opportunity_id}/documents/process/stream")
async def stream_document_processing(
    opportunity_id: str,
    document_ids: str = Query(..., description="Comma-separated list of document IDs to process"),
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    processing_service: DocumentProcessingService = Depends(get_document_processing_service)
):
    """
    Stream document processing progress via Server-Sent Events (SSE).
    
    This endpoint processes documents and streams real-time progress updates.
    Use EventSource on the client side to receive updates.
    
    Example:
    ```javascript
    const eventSource = new EventSource('/api/opportunity/opportunities/{id}/documents/process/stream?document_ids=doc1,doc2');
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
    };
    ```
    
    Event types:
    - processing_started: Processing has begun
    - document_started: Started processing a document
    - stage_started: Started a processing stage
    - stage_progress: Progress update for current stage
    - stage_completed: Completed a processing stage
    - document_completed: Completed processing a document
    - processing_completed: All documents processed
    - error: An error occurred
    """
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        # Parse document IDs
        doc_id_list = [doc_id.strip() for doc_id in document_ids.split(',') if doc_id.strip()]
        if not doc_id_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid document IDs provided"
            )
        
        # Return SSE stream
        return StreamingResponse(
            processing_service.process_documents_stream(
                document_ids=doc_id_list,
                opportunity_id=opportunity_id
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable buffering for nginx
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stream document processing: {str(e)}"
        )


@router.get("/opportunities/{opportunity_id}/documents/{document_id}/processing-status")
async def get_document_processing_status(
    opportunity_id: str,
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    processing_service: DocumentProcessingService = Depends(get_document_processing_service)
):
    """Get the current processing status of a document"""
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        status_info = await processing_service.get_processing_status(
            document_id=document_id,
            opportunity_id=opportunity_id
        )
        
        if not status_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        return status_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get processing status: {str(e)}"
        )


@router.get("/opportunities/{opportunity_id}/processing-statistics")
async def get_processing_statistics(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get processing statistics for all documents in an opportunity"""
    try:
        # Verify user has access to the opportunity
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id, owner_id=current_user.email)
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity with ID {opportunity_id} not found"
            )
        
        statistics = await document_service.get_processing_statistics(opportunity_id)
        return statistics
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get processing statistics: {str(e)}"
        )


# endregion
