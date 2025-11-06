// ========================================
// Investment Analysis Application - Main Infrastructure
// ========================================

targetScope = 'resourceGroup'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Id of the user or app to assign application roles')
param principalId string = ''

@description('Tags to apply to all resources')
param tags object = {}

// ========================================
// Variables
// ========================================

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var cosmosDbAccountName = '${abbrs.documentDBDatabaseAccounts}${resourceToken}'
var cosmosDbDatabaseName = 'ai-investment-analysis-sample'
var allTags = union(tags, {
  'azd-env-name': environmentName
})

// ========================================
// Cosmos DB Account
// ========================================

module cosmosDb 'br/public:avm/res/document-db/database-account:0.18.0' = {
  name: 'cosmosdb-deployment'
  params: {
    name: cosmosDbAccountName
    location: location
    tags: allTags
    
    // Use SQL (NoSQL) API
    databaseAccountOfferType: 'Standard'
    
    // Default consistency for session-based consistency
    defaultConsistencyLevel: 'Session'
    
    // Single region deployment
    failoverLocations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    
    // Enable automatic failover
    enableAutomaticFailover: false
    
    // Security settings
    disableLocalAuthentication: false
    disableKeyBasedMetadataWriteAccess: true
    minimumTlsVersion: 'Tls12'
    
    // Network settings - adjust based on your security requirements
    networkRestrictions: {
      publicNetworkAccess: 'Enabled'
      ipRules: []
      virtualNetworkRules: []
      networkAclBypass: 'AzureServices'
    }
    
    // Backup policy
    backupPolicyType: 'Continuous'
    backupPolicyContinuousTier: 'Continuous30Days'
    
    // SQL Database configuration
    sqlDatabases: [
      {
        name: cosmosDbDatabaseName
        containers: [
          {
            name: 'opportunities'
            paths: ['/id']
            kind: 'Hash'
            defaultTtl: -1
            indexingPolicy: {
              automatic: true
              indexingMode: 'consistent'
            }
          }
          {
            name: 'documents'
            paths: ['/id']
            kind: 'Hash'
            defaultTtl: -1
            indexingPolicy: {
              automatic: true
              indexingMode: 'consistent'
            }
          }
          {
            name: 'analysis'
            paths: ['/opportunity_id']
            kind: 'Hash'
            defaultTtl: -1
            indexingPolicy: {
              automatic: true
              indexingMode: 'consistent'
            }
          }
          {
            name: 'users'
            paths: ['/id']
            kind: 'Hash'
            defaultTtl: -1
            indexingPolicy: {
              automatic: true
              indexingMode: 'consistent'
            }
          }
        ]
      }
    ]
    
    // Enable serverless for cost-effective development
    capabilitiesToAdd: ['EnableServerless']
    
    // Throughput limit for serverless
    totalThroughputLimit: 4000
  }
}

// ========================================
// Outputs
// ========================================

@description('The name of the Cosmos DB account')
output COSMOS_DB_ACCOUNT_NAME string = cosmosDb.outputs.name

@description('The endpoint of the Cosmos DB account')
output COSMOS_DB_ENDPOINT string = cosmosDb.outputs.endpoint

@description('The name of the Cosmos DB database')
output COSMOS_DB_DATABASE_NAME string = cosmosDbDatabaseName

@description('The resource group location')
output AZURE_LOCATION string = location

@description('The environment name')
output AZURE_TENANT_ID string = tenant().tenantId
