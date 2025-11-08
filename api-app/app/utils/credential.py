from azure.identity import DefaultAzureCredential
from azure.identity.aio import (
    DefaultAzureCredential as DefaultAzureCredentialAsync,
)


async def get_azure_credential_async():
    """
    Get Azure credential for async operations.
    Uses DefaultAzureCredential which tries credentials in this order:
    1. EnvironmentCredential
    2. ManagedIdentityCredential
    3. AzureDeveloperCliCredential (azd auth)
    4. Others...
    
    Note: AzureCliCredential is excluded due to known issues with
    Cosmos DB scope handling.
    """
    return DefaultAzureCredentialAsync(
        exclude_cli_credential=True,
        exclude_powershell_credential=True,
        exclude_visual_studio_code_credential=True,
    )


def get_azure_credential():
    """
    Get Azure credential for sync operations.
    Uses DefaultAzureCredential with CLI excluded due to known
    Cosmos DB authentication issues.
    """
    return DefaultAzureCredential(
        exclude_cli_credential=True,
        exclude_powershell_credential=True,
        exclude_visual_studio_code_credential=True,
    )





