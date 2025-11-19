@description('Location for all resources')
param location string = resourceGroup().location

@description('Log Analytics workspace name')
param logAnalyticsWorkspaceName string

@description('User Assigned Identity that be given access to the Log Analytics Workspace')
param roleAssignedManagedIdentityPrincipalIds string[]

@description('Tags for resources')
param tags object = {}

// Use Azure Verified Module for Log Analytics Workspace
module logAnalytics 'br:mcr.microsoft.com/bicep/avm/res/operational-insights/workspace:0.12.0' = {
  params: {
    name: logAnalyticsWorkspaceName
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
    roleAssignments:[
      for principalId in roleAssignedManagedIdentityPrincipalIds: {
        principalId: principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Log Analytics Contributor'        
      }
    ]
  }
}

output resourceId string = logAnalytics.outputs.resourceId
output name string = logAnalytics.outputs.name
output logAnalyticsWorkspaceId string = logAnalytics.outputs.logAnalyticsWorkspaceId
@secure()
output primarySharedKey string = logAnalytics.outputs.primarySharedKey
@secure()
output secondarySharedKey string = logAnalytics.outputs.secondarySharedKey
