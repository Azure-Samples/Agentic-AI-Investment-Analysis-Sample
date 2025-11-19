from azure.cosmos import exceptions, ContainerProxy, DatabaseProxy, PartitionKey
from azure.cosmos.aio import CosmosClient
from azure.identity.aio import ChainedTokenCredential

import logging
from typing import Dict

# Configure logging

logger = logging.getLogger("app.database.cosmos")

class CosmosDBClient:
    """Azure Cosmos DB client wrapper"""

    def __init__(self, database: str, endpoint: str, credential: str | ChainedTokenCredential):
        self.database = database
        self.endpoint = endpoint
        self.credential = credential
        self.client: CosmosClient = None
        self.database_proxy: DatabaseProxy = None
        self.containers: Dict[str, ContainerProxy] = {}
        
    async def connect(self):
        """Initialize Cosmos DB connection"""
        
        logger.info("Connecting to Cosmos DB...")
        
        try:
            self.client = CosmosClient(
                url=self.endpoint,
                credential=self.credential
            )
            
            logger.info("Attempting to create or get database...")
            # Create database if it doesn't exist
            self.database_proxy = self.client.get_database_client(
                database=self.database
            )
            logger.info(f"Database '{self.database}' is ready.")
            
            
            logger.info("Initializing containers...")
            # Initialize containers
            self._initialize_containers()
            logger.info(f"Initialized {len(self.containers)} containers.")
            
            
            logger.info("Successfully connected to Cosmos DB")
        
        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"Cosmos DB HTTP error: {str(e)}")
            logger.exception(e)
            raise
        except Exception as e:
            logger.error(f"Failed to connect to or initialize Cosmos DB: {str(e)}")
            logger.exception(e)
            raise
    
    async def close(self):
        """Close Cosmos DB connection"""
        if self.client:
            await self.client.close()
            self.client = None
            self.database_proxy = None
            self.containers = {}
            logger.info("Cosmos DB connection closed")

    def _initialize_containers(self):
        """Initialize all required containers"""
        containers_config = [
            {
                "id": "opportunities",
                "partition_key": "/owner_id",
                "throughput": 400
            },
            {
                "id": "users",
                "partition_key": "/email",
                "throughput": 400
            },
            {
                "id": "documents", 
                "partition_key": "/opportunity_id",
                "throughput": 400
            },
            {
                "id": "analysis",
                "partition_key": "/opportunity_id",
                "throughput": 400
            },
            {
                "id": "workflow_events",
                "partition_key": "/analysis_id",
                "throughput": 400
            },
            {
                "id": "what_if_conversations",
                "partition_key": "/analysis_id",
                "throughput": 400
            },
        ]
        
        for container_config in containers_config:
            self._load_container(container_config["id"])
            logger.info(f"Container '{container_config['id']}' ready.")
            
    
    def _load_container(self, container_name: str):
        """Ensure the container is initialized"""
        if container_name not in self.containers:
            container = self.database_proxy.get_container_client(container=container_name)

            self.containers[container_name] = container


    def get_container(self, container_name: str) -> ContainerProxy:
        """Get container by name"""
        
        return self.containers[container_name]
