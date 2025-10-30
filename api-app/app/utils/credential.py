from azure.identity import ChainedTokenCredential, EnvironmentCredential, AzureCliCredential
from azure.identity.aio import ChainedTokenCredential as ChainedTokenCredentialAsync, EnvironmentCredential as EnvironmentCredentialAsync, AzureCliCredential as AzureCliCredentialAsync

async def get_azure_credential_async():
    credential_chain = (
        # Try EnvironmentCredential first
        EnvironmentCredentialAsync(),
        # Fallback to Azure CLI if EnvironmentCredential fails
        AzureCliCredentialAsync(),
    )

    return ChainedTokenCredentialAsync(*credential_chain)


def get_azure_credential():
    credential_chain = (
        # Try EnvironmentCredential first
        EnvironmentCredential(),
        # Fallback to Azure CLI if EnvironmentCredential fails
        AzureCliCredential(),
    )

    return ChainedTokenCredential(*credential_chain)