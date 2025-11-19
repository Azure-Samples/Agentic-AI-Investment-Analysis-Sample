@description('Optional: Location for all resources. Default is the resource group location')
param location string = resourceGroup().location

@description('Required: User Assigned Identity name')
param userAssignedIdentityName string

@description('Optional: Tags for resources')
param tags object = {}


// Use Azure Verified Module for Config Store
module userAssignedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.1' = {
  params: {
    // Required parameters
    name: userAssignedIdentityName
    // Non-required parameters
    location: location
    tags: tags
  }
}

output name string = userAssignedIdentity.outputs.name
output resourceId string = userAssignedIdentity.outputs.resourceId
output principalId string = userAssignedIdentity.outputs.principalId
output clientId string = userAssignedIdentity.outputs.clientId
