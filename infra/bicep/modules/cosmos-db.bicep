@description('Optional: Location for all resources')
param location string = resourceGroup().location

@description('Required: Cosmos DB account name')
param cosmosAccountName string

@description('Required: Cosmos DB database name')
param cosmosDbName string

@description('Optional: Cosmos DB container names used in the application')
param cosmosDBContainerNames array

@description('Required: List of principal IDs (managed identity or user) to be assigned Cosmos DB SQL Data Contributor role')
param cosmosDBDataContributorPrincipalIds string[]

@description('Enable zone redundancy for Cosmos DB account')
param zoneRedundant bool = false

@description('Optional: Tags for resources')
param tags object = {}


// Use Azure Verified Module for Cosmos DB
module cosmosDb 'br:mcr.microsoft.com/bicep/avm/res/document-db/database-account:0.16.0' = {
  params: {
    name: cosmosAccountName
    location: location
    tags: tags
    capabilitiesToAdd: [
      'EnableServerless'
    ]
    databaseAccountOfferType: 'Standard'
    disableLocalAuthentication: true
    backupPolicyContinuousTier: 'Continuous7Days'
    networkRestrictions: {
      publicNetworkAccess: 'Enabled'
    }
    zoneRedundant: zoneRedundant
    sqlDatabases: [
      {
        name: cosmosDbName
        containers: [for container in cosmosDBContainerNames: {
            name: container.name
            paths: [container.partitionKey]
            kind: 'Hash'
          }
        ]
      }
    ]
    dataPlaneRoleDefinitions: [
      {
        // Cosmos DB Built-in Data Contributor: https://docs.azure.cn/en-us/cosmos-db/nosql/security/reference-data-plane-roles#cosmos-db-built-in-data-contributor
        roleName: 'Cosmos DB SQL Data Contributor'
        dataActions: [
          'Microsoft.DocumentDB/databaseAccounts/readMetadata'
          'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/*'
          'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/*'
        ]
        assignments: [
          for principalId in cosmosDBDataContributorPrincipalIds: {
            principalId: principalId
          }
        ]
      }
    ]
  }
}

output cosmosAccountName string = cosmosDb.outputs.name
output cosmosEndpoint string = cosmosDb.outputs.endpoint
output cosmosDBName string = cosmosDbName
