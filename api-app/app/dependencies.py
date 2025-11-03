
from app.utils.credential import get_azure_credential_async
from app.core.config import settings
from app.database.cosmos import CosmosDBClient


# Global Cosmos DB client instance
cosmos_client: CosmosDBClient = None


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

async def initialize_all():
    """Initialize all dependencies"""
    global cosmos_client
    if not cosmos_client:
        cosmos_client = CosmosDBClient(settings.COSMOS_DB_DATABASE_NAME, settings.COSMOS_DB_ENDPOINT, await get_azure_credential_async())
        await cosmos_client.connect()
    
    # Initialize blob storage
    from app.utils.blob_storage import get_blob_storage_service
    await get_blob_storage_service()
        

async def close_all():
    """Close all dependencies"""
    if cosmos_client:
        await cosmos_client.close()
    
    # Close blob storage
    from app.utils.blob_storage import close_blob_storage_service
    await close_blob_storage_service()
