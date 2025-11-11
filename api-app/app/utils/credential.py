from azure.identity import ChainedTokenCredential, EnvironmentCredential, AzureCliCredential
from azure.identity.aio import ChainedTokenCredential as ChainedTokenCredentialAsync, EnvironmentCredential as EnvironmentCredentialAsync, AzureCliCredential as AzureCliCredentialAsync

_async_credential : ChainedTokenCredentialAsync = None
_synch_credential : ChainedTokenCredential = None

async def get_azure_credential_async():
    credential_chain = (
        # Try EnvironmentCredential first
        EnvironmentCredentialAsync(),
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
        # Fallback to Azure CLI if EnvironmentCredential fails
        AzureCliCredential(),
    )
    
    global _synch_credential
    if not _synch_credential:
        _synch_credential = ChainedTokenCredential(*credential_chain)

    return _synch_credential