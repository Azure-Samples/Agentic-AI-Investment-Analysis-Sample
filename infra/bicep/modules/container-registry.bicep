@description('Required: Name of the Container Registry')
param containerRegistryName string

@description('Optional: Location for all resources. Default is the resource group location')
param location string = resourceGroup().location

@description('Optional: Container Registry SKU. Default is Basic')
param sku string = 'Basic'

@description('Optional: Admin user enabled. Default is true')
param adminUserEnabled bool = true

@description('Public network access setting for the Azure Container Registry')
param publicNetworkAccess string = 'Enabled'

@description('Zone redundancy setting for the Azure Container Registry')
param zoneRedundancy string = 'Disabled'

@description('Managed Identity that will be given access to the Container Registry')
param roleAssignedManagedIdentityPrincipalIds string[]

@description('Optional: Tags for resources')
param tags object = {}

var roleAssignmentsAcrPull = [
    for principalId in roleAssignedManagedIdentityPrincipalIds: {
      principalId: principalId
      principalType: 'ServicePrincipal'
      roleDefinitionIdOrName: 'AcrPull'        
    }
  ]

var roleAssignmentsAcrPush = [
    for principalId in roleAssignedManagedIdentityPrincipalIds: {
      principalId: principalId
      principalType: 'ServicePrincipal'
      roleDefinitionIdOrName: 'AcrPush'        
    }
  ]

var roleAssignmentsAcrDelete = [
    for principalId in roleAssignedManagedIdentityPrincipalIds: {
      principalId: principalId
      principalType: 'ServicePrincipal'
      roleDefinitionIdOrName: 'AcrDelete'        
    }
  ]

// Use Azure Verified Module for Container Registry
module containerRegistry 'br:mcr.microsoft.com/bicep/avm/res/container-registry/registry:0.9.3' = {
  params: {
    name: containerRegistryName
    location: location
    tags: tags
    acrSku: sku
    acrAdminUserEnabled: adminUserEnabled
    publicNetworkAccess: publicNetworkAccess
    zoneRedundancy: zoneRedundancy
    roleAssignments: concat(roleAssignmentsAcrPull, roleAssignmentsAcrPush, roleAssignmentsAcrDelete)
  }
}

// Output
output name string = containerRegistry.outputs.name
output loginServer string = containerRegistry.outputs.loginServer
output resourceGroupName string = containerRegistry.outputs.resourceGroupName
output resourceId string = containerRegistry.outputs.resourceId
output systemAssignedMIPrincipalId string? = containerRegistry.outputs.?systemAssignedMIPrincipalId
output credentialSetsSystemAssignedMIPrincipalIds array = containerRegistry.outputs.credentialSetsSystemAssignedMIPrincipalIds
output credentialSetsResourceIds array = containerRegistry.outputs.credentialSetsResourceIds
output privateEndpoints array = containerRegistry.outputs.privateEndpoints
