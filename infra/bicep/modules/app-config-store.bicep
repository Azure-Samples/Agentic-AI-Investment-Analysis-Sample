@description('Location for all resources')
param location string = resourceGroup().location

@description('App Configuration Store name')
param appConfigStoreName string

@description('Managed Identity that will be given access to the App Configuration Store')
param roleAssignedManagedIdentityPrincipalIds string[]

@description('Key-Value pairs to initialize in the App Configuration Store')
param configurationKeyValues array = []

@description('Tags for resources')
param tags object = {}

// Create list of role assignments for the managed identities
var roleAssignments = [
    for principalId in roleAssignedManagedIdentityPrincipalIds: {
      principalId: principalId
      principalType: 'ServicePrincipal'
      roleDefinitionIdOrName: 'App Configuration Data Reader'        
    }
  ]

var deployerRoleAssignments = [
    {
      principalId: deployer().objectId
      principalType: 'User'
      roleDefinitionIdOrName: 'App Configuration Data Owner'        
    }
  ]

// Use Azure Verified Module for Config Store
module configurationStore 'br/public:avm/res/app-configuration/configuration-store:0.9.2' = {
  params: {
    // Required parameters
    name: appConfigStoreName
    // Non-required parameters
    location: location
    tags: tags
    sku: 'Standard'
    createMode: 'Default'
    disableLocalAuth: false
    enablePurgeProtection: false
    keyValues: [
      for config in configurationKeyValues: {
        contentType: config.contentType
        name: config.name
        value: config.value
      }
    ]
    softDeleteRetentionInDays: 1
    roleAssignments: concat(roleAssignments, deployerRoleAssignments)
  }
}

output endpoint string = configurationStore.outputs.endpoint
output resourceId string = configurationStore.outputs.resourceId
output name string = configurationStore.outputs.name
