import logging
import os
from typing import Optional, BinaryIO
from datetime import datetime, timedelta, timezone
from azure.storage.blob import BlobServiceClient, BlobClient, ContentSettings, generate_blob_sas, BlobSasPermissions
from azure.core.exceptions import ResourceNotFoundError, AzureError

from app.core.config import settings
from app.utils.credential import get_azure_credential

logger = logging.getLogger("app.utils.blob_storage")


class BlobStorageService:
    """Service for interacting with Azure Blob Storage"""
    
    def __init__(self):
        self.account_name = settings.AZURE_STORAGE_ACCOUNT_NAME
        self.container_name = settings.AZURE_STORAGE_CONTAINER_NAME
        self.blob_service_client: Optional[BlobServiceClient] = None
        
    async def connect(self):
        """Initialize the blob service client"""
        try:
            # Use DefaultAzureCredential (recommended for production)
            credential = get_azure_credential()
            account_url = f"https://{self.account_name}.blob.core.windows.net"
            self.blob_service_client = BlobServiceClient(
                account_url=account_url,
                credential=credential
            )
            logger.info("Connected to Azure Blob Storage using DefaultAzureCredential")
            
            # Ensure container exists
            await self._ensure_container_exists()
            
        except Exception as e:
            logger.error(f"Failed to connect to Azure Blob Storage: {str(e)}")
            raise
    
    async def _ensure_container_exists(self):
        """Ensure the container exists, create if it doesn't"""
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            
            # Check if container exists
            if not container_client.exists():
                container_client.create_container()
                logger.info(f"Created container: {self.container_name}")
            else:
                logger.debug(f"Container already exists: {self.container_name}")
                
        except Exception as e:
            logger.error(f"Error ensuring container exists: {str(e)}")
            raise
        
    async def upload_file(
        self,
        file_content: bytes,
        blob_name: str,
        content_type: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Upload a file to blob storage
        
        Returns:
            tuple: (blob_url, blob_name)
        """
        try:
            blob_name = blob_name
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            # Set content settings
            content_settings = None
            if content_type:
                content_settings = ContentSettings(content_type=content_type)
            
            # Upload the file
            blob_client.upload_blob(
                file_content,
                content_settings=content_settings,
                overwrite=False
            )
            
            blob_url = blob_client.url
            logger.info(f"Successfully uploaded file to: {blob_name}")
            
            return blob_url
            
        except Exception as e:
            logger.error(f"Error uploading file {blob_name}: {str(e)}")
            raise
    
    async def download_file(self, blob_name: str) -> bytes:
        """Download a file from blob storage"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            download_stream = blob_client.download_blob()
            file_content = download_stream.readall()
            
            logger.info(f"Successfully downloaded file: {blob_name}")
            return file_content
            
        except ResourceNotFoundError:
            logger.warning(f"Blob not found: {blob_name}")
            raise
        except Exception as e:
            logger.error(f"Error downloading file {blob_name}: {str(e)}")
            raise
    
    async def delete_file(self, blob_name: str) -> bool:
        """Delete a file from blob storage"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            blob_client.delete_blob()
            logger.info(f"Successfully deleted file: {blob_name}")
            return True
            
        except ResourceNotFoundError:
            logger.warning(f"Blob not found for deletion: {blob_name}")
            return False
        except Exception as e:
            logger.error(f"Error deleting file {blob_name}: {str(e)}")
            raise
    
    async def delete_files_by_prefix(self, prefix: str) -> int:
        """Delete all files with a given prefix (e.g., all files for an opportunity)"""
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            deleted_count = 0
            
            # List all blobs with the prefix
            blob_list = container_client.list_blobs(name_starts_with=prefix)
            
            for blob in blob_list:
                await self.delete_file(blob.name)
                deleted_count += 1
            
            logger.info(f"Deleted {deleted_count} files with prefix: {prefix}")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error deleting files with prefix {prefix}: {str(e)}")
            raise
    
    def generate_download_url(
        self,
        blob_name: str,
        expiry_hours: int = 1
    ) -> str:
        """
        Generate a SAS URL for downloading a blob
        
        Args:
            blob_name: Name of the blob
            expiry_hours: Hours until the SAS token expires
            
        Returns:
            str: URL with SAS token
        """
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            return blob_client.url
            
        except Exception as e:
            logger.error(f"Error generating download URL for {blob_name}: {str(e)}")
            raise
    
    async def close(self):
        """Close the blob service client"""
        if self.blob_service_client:
            self.blob_service_client.close()
            logger.info("Closed Azure Blob Storage connection")


# Global blob storage service instance
_blob_storage_service: Optional[BlobStorageService] = None


async def get_blob_storage_service() -> BlobStorageService:
    """Get or create the blob storage service singleton"""
    global _blob_storage_service
    
    if _blob_storage_service is None:
        _blob_storage_service = BlobStorageService()
        await _blob_storage_service.connect()
    
    return _blob_storage_service


async def close_blob_storage_service():
    """Close the blob storage service"""
    global _blob_storage_service
    
    if _blob_storage_service:
        await _blob_storage_service.close()
        _blob_storage_service = None
