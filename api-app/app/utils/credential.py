import os
from azure.identity import ChainedTokenCredential, EnvironmentCredential, ManagedIdentityCredential, AzureCliCredential
from azure.identity.aio import (ChainedTokenCredential as ChainedTokenCredentialAsync, 
                                EnvironmentCredential as EnvironmentCredentialAsync, 
                                ManagedIdentityCredential as ManagedIdentityCredentialAsync,
                                AzureCliCredential as AzureCliCredentialAsync)

_async_credential : ChainedTokenCredentialAsync = None
_synch_credential : ChainedTokenCredential = None

async def get_azure_credential_async():
    credential_chain = (
        # Try EnvironmentCredential first
        EnvironmentCredentialAsync(),
        # Then try ManagedIdentityCredential
        ManagedIdentityCredentialAsync(client_id=os.environ.get("AZURE_CLIENT_ID")),
        # Fallback to Azure CLI if EnvironmentCredential fails
        AzureCliCredentialAsync(),
    )

    global _async_credential
    if not _async_credential:
        _async_credential = ChainedTokenCredentialAsync(*credential_chain)
        
    return _async_credential


def get_azure_credential():
    credential_chain = (
        # Try EnvironmentCredential first
        EnvironmentCredential(),
        # Then try ManagedIdentityCredential
        ManagedIdentityCredential(client_id=os.environ.get("AZURE_CLIENT_ID")),
        # Fallback to Azure CLI if EnvironmentCredential fails
        AzureCliCredential(),
    )
    
    global _synch_credential
    if not _synch_credential:
        _synch_credential = ChainedTokenCredential(*credential_chain)

    return _synch_credential