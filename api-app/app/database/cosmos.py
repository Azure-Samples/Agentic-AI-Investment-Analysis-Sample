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
        try:
            self.client = CosmosClient(
                url=self.endpoint,
                credential=self.credential
            )
            
            # Create database if it doesn't exist
            self.database_proxy = await self.client.create_database_if_not_exists(
                id=self.database
            )
            
            # Initialize containers
            await self._initialize_containers()
            
            logger.info("Successfully connected to Cosmos DB")
            
        except Exception as e:
            logger.error(f"Failed to connect to or initialize Cosmos DB: {str(e)}")
            raise
    
    async def close(self):
        """Close Cosmos DB connection"""
        if self.client:
            await self.client.close()
            self.client = None
            self.database_proxy = None
            self.containers = {}
            logger.info("Cosmos DB connection closed")

    async def _initialize_containers(self):
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
        ]
        
        for container_config in containers_config:
            
            await self._ensure_container(container_config["id"], container_config["partition_key"])
            
            logger.info(f"Container '{container_config['id']}' ready.")
    
    
    async def _ensure_container(self, container_name: str, partition_key: str = "/id"):
        """Ensure the container is initialized"""
        if container_name not in self.containers:
            try:
                container = await self.database_proxy.create_container(
                    id=container_name,
                    partition_key=PartitionKey(path=partition_key)
                )
            except exceptions.CosmosResourceExistsError:
                container = self.database_proxy.get_container_client(container_name)

            self.containers[container_name] = container


    def get_container(self, container_name: str) -> ContainerProxy:
        """Get container by name"""
        
        return self.containers[container_name]
