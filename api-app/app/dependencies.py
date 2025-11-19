
from agent_framework import BaseChatClient

from app.utils.credential import get_azure_credential, get_azure_credential_async
from app.core.config import settings
from app.database.cosmos import CosmosDBClient
from app.utils.sse_stream_event_queue import SSEStreamEventQueue

# Global Cosmos DB client instance
cosmos_client: CosmosDBClient = None

# Global event queue sessions
_sse_event_queue_sessions: dict[str, SSEStreamEventQueue] = {}

# Dependency to get database connection
async def get_cosmos_client() -> CosmosDBClient:
    """Dependency to get Cosmos DB client"""
    global cosmos_client
    return cosmos_client

async def get_opportunity_service():
    """Dependency to get OpportunityService"""
    from app.services.opportunity_service import OpportunityService
    global cosmos_client
    return OpportunityService(cosmos_client)

async def get_analysis_service():
    """Dependency to get AnalysisService"""
    from app.services.analysis_service import AnalysisService
    global cosmos_client
    return AnalysisService(cosmos_client)

async def get_document_service():
    """Dependency to get DocumentService"""
    from app.services.document_service import DocumentService
    from app.utils.blob_storage import get_blob_storage_service
    global cosmos_client
    blob_storage = await get_blob_storage_service()
    return DocumentService(cosmos_client, blob_storage)

async def get_document_processing_service():
    """Dependency to get DocumentProcessingService"""
    from app.services.document_processing_service import DocumentProcessingService
    global cosmos_client
    return DocumentProcessingService(cosmos_client)

async def get_analysis_workflow_events_service():
    """Dependency to get WorkflowEventsService"""
    from app.services.analysis_workflow_events_service import AnalysisWorkflowEventsService
    global cosmos_client
    return AnalysisWorkflowEventsService(cosmos_client)

async def get_analysis_workflow_execution_service():
    """Dependency to get WorkflowEventsService"""
    from app.services.analysis_workflow_executor_service import AnalysisWorkflowExecutorService
    return AnalysisWorkflowExecutorService(analysis_service=await get_analysis_service(),
                                           opportunity_service=await get_opportunity_service(),
                                           workflow_events_service=await get_analysis_workflow_events_service())

async def get_what_if_message_repository():
    """Dependency to get WhatIfMessageRepository"""
    from app.database.repositories import WhatIfMessageRepository
    global cosmos_client
    return WhatIfMessageRepository(cosmos_client)

async def get_what_if_workflow_executor_service():
    """Dependency to get WhatIfWorkflowExecutorService"""
    from app.services.whatif_workflow_executor_service import WhatIfWorkflowExecutorService
    service = WhatIfWorkflowExecutorService(analysis_service=await get_analysis_service(), 
                                            what_if_message_repository=await get_what_if_message_repository())
    await service.initialize()
    return service

async def get_sse_event_queue_for_session(session_id: str):
    """Get the event queue for a specific session (alias for global queue)"""
    from app.utils.sse_stream_event_queue import SSEStreamEventQueue
    global _sse_event_queue_sessions
    if session_id not in _sse_event_queue_sessions:
        _sse_event_queue_sessions[session_id] = SSEStreamEventQueue()
    return _sse_event_queue_sessions[session_id]

async def close_sse_event_queue_for_session(session_id: str):
    """Close and remove the event queue for a specific session"""
    global _sse_event_queue_sessions
    if session_id in _sse_event_queue_sessions:
        await _sse_event_queue_sessions[session_id].clear_event_queue()
        del _sse_event_queue_sessions[session_id]

async def get_chat_client() -> BaseChatClient:
    """Dependency to get AzureOpenAIChatClient"""
    from agent_framework.azure import AzureOpenAIChatClient
    credential = get_azure_credential()
    return AzureOpenAIChatClient(endpoint=settings.AZURE_OPENAI_ENDPOINT,
                                 deployment_name=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                                 credential=credential)

async def initialize_all():
    """Initialize all dependencies"""
    print("Initializing dependencies...")
    try:
        global cosmos_client
        if not cosmos_client:
            cosmos_client = CosmosDBClient(settings.COSMOS_DB_DATABASE_NAME, settings.COSMOS_DB_ENDPOINT, await get_azure_credential_async())
            await cosmos_client.connect()
        
        # Initialize blob storage
        from app.utils.blob_storage import get_blob_storage_service
        await get_blob_storage_service()
    except Exception as e:
        print(f"Error during dependencies initialization: {str(e)}")
        print("Stack trace:")
        import traceback
        traceback.print_exc()
        raise

async def close_all():
    """Close all dependencies"""
    if cosmos_client:
        await cosmos_client.close()
    
    # Close blob storage
    from app.utils.blob_storage import close_blob_storage_service
    await close_blob_storage_service()
