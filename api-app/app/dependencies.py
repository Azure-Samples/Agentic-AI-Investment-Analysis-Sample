
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

async def initialize_all():
    """Initialize all dependencies"""
    global cosmos_client
    if not cosmos_client:
        cosmos_client = CosmosDBClient(settings.COSMOS_DB_DATABASE_NAME, settings.COSMOS_DB_ENDPOINT, await get_azure_credential_async())
        await cosmos_client.connect()
        

async def close_all():
    """Close all dependencies"""
    if cosmos_client:
        await cosmos_client.close()
