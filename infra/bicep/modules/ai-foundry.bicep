@description('Optional: Location for all resources. Default is the resource group location')
param location string = resourceGroup().location

@description('Required: Name of the Container Registry')
param aiFoundryBaseName string

@description('Managed Identity that will be given access to the AI Foundry Resource')
param roleAssignedManagedIdentityPrincipalIds string[]

@description('Tags for resources')
param tags object = {}

module aiFoundry 'br/public:avm/ptn/ai-ml/ai-foundry:0.5.0' = {
  params: {
    // Required parameters
    baseName: aiFoundryBaseName
    location: location
    tags: tags
    // Non-required parameters
    aiFoundryConfiguration: {
      // accountName: '<accountName>'
      allowProjectManagement: true
      createCapabilityHosts: false
      disableLocalAuth: true
      location: location
      project: {
        desc: 'AI Foundry project for AI Investment Analysis Sample'
        displayName: 'AI-Invest'
        name: 'aiinvest-project'
      }
      roleAssignments: [
        for principalId in roleAssignedManagedIdentityPrincipalIds: {
          principalId: principalId
          principalType: 'ServicePrincipal'
          roleDefinitionIdOrName: '53ca6127-db72-4b80-b1b0-d745d6d5456d' // 'Azure AI User'       
        }
      ]
      sku: 'S0'
    }
    aiModelDeployments: [
      {
        model: {
          format: 'OpenAI'
          name: 'gpt-4.1-mini'
          version: '2025-04-14'
        }
        name: 'gpt-4.1-mini'
        sku: {
          capacity: 100
          name: 'GlobalStandard'
        }
      }
    ]
    // aiSearchConfiguration: {
    //   name: '<name>'
    //   privateDnsZoneResourceId: '<privateDnsZoneResourceId>'
    //   roleAssignments: [
    //     {
    //       principalId: '<principalId>'
    //       principalType: 'ServicePrincipal'
    //       roleDefinitionIdOrName: 'Search Index Data Contributor'
    //     }
    //   ]
    // }
    // // baseUniqueName: '<baseUniqueName>'
    // cosmosDbConfiguration: {
    //   name: '<name>'
    //   privateDnsZoneResourceId: '<privateDnsZoneResourceId>'
    //   roleAssignments: [
    //     {
    //       principalId: '<principalId>'
    //       principalType: 'ServicePrincipal'
    //       roleDefinitionIdOrName: 'Cosmos DB Account Reader Role'
    //     }
    //   ]
    // }
    includeAssociatedResources: false
    // keyVaultConfiguration: {
    //   name: '<name>'
    //   privateDnsZoneResourceId: '<privateDnsZoneResourceId>'
    //   roleAssignments: [
    //     {
    //       principalId: '<principalId>'
    //       principalType: 'ServicePrincipal'
    //       roleDefinitionIdOrName: 'Key Vault Secrets User'
    //     }
    //   ]
    // }
  }
}


output aiProjectName string = aiFoundry.outputs.aiProjectName
output aiServicesName string = aiFoundry.outputs.aiServicesName
