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
var storageAccountName = '${abbrs.storageStorageAccounts}${resourceToken}'
var storageContainerName = 'opportunity-documents'
var appServicePlanName = '${abbrs.appServicePlans}${resourceToken}'
var apiAppName = '${abbrs.appServiceWebApps}api-${resourceToken}'
var staticWebAppName = 'swa-${resourceToken}'
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
    disableLocalAuthentication: true  // Use RBAC instead of keys
    disableKeyBasedMetadataWriteAccess: false  // Allow metadata operations via RBAC
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
    
    // RBAC role assignments - Cosmos DB Built-in Data Contributor
    sqlRoleAssignments: principalId != '' ? [
      {
        name: guid(principalId, cosmosDbAccountName, '00000000-0000-0000-0000-000000000002')
        roleDefinitionId: '00000000-0000-0000-0000-000000000002'
        principalId: principalId
      }
      {
        name: guid(principalId, cosmosDbAccountName, '00000000-0000-0000-0000-000000000001')
        roleDefinitionId: '00000000-0000-0000-0000-000000000001'
        principalId: principalId
      }
    ] : []
  }
}

// ========================================
// App Service Plan
// ========================================

module appServicePlan 'br/public:avm/res/web/serverfarm:0.4.0' = {
  name: 'appservice-plan-deployment'
  params: {
    name: appServicePlanName
    location: location
    tags: allTags
    
    // Linux-based plan for Python
    kind: 'linux'
    reserved: true
    
    // Use Basic tier for development (adjust for production)
    skuName: 'B1'
    skuCapacity: 1
  }
}

// ========================================
// API App Service
// ========================================

module apiAppService 'br/public:avm/res/web/site:0.13.0' = {
  name: 'api-appservice-deployment'
  params: {
    name: apiAppName
    location: location
    tags: union(allTags, {
      'azd-service-name': 'api'
    })
    
    kind: 'app,linux'
    serverFarmResourceId: appServicePlan.outputs.resourceId
    
    // Enable system-assigned managed identity
    managedIdentities: {
      systemAssigned: true
    }
    
    // Python runtime configuration
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
      alwaysOn: true
      appCommandLine: 'python -m uvicorn main:app --host 0.0.0.0 --port 8000'
    }
    
    // App settings - using RBAC authentication (no keys)
    appSettingsKeyValuePairs: {
      COSMOS_DB_ENDPOINT: cosmosDb.outputs.endpoint
      COSMOS_DB_DATABASE_NAME: cosmosDbDatabaseName
      AZURE_STORAGE_ACCOUNT_NAME: storageAccountName
      AZURE_STORAGE_CONTAINER_NAME: storageContainerName
      SCM_DO_BUILD_DURING_DEPLOYMENT: 'true'
      ENABLE_ORYX_BUILD: 'true'
    }
  }
}

// Reference to the Cosmos DB account for role assignments
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' existing = {
  name: cosmosDbAccountName
}

// Assign Cosmos DB Data Contributor role to API App Service
resource apiAppCosmosDbRoleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-05-15' = {
  parent: cosmosDbAccount
  name: guid(subscription().id, resourceGroup().id, apiAppName, 'contributor')
  properties: {
    roleDefinitionId: resourceId('Microsoft.DocumentDB/databaseAccounts/sqlRoleDefinitions', cosmosDbAccountName, '00000000-0000-0000-0000-000000000002')
    principalId: apiAppService.outputs.systemAssignedMIPrincipalId
    scope: cosmosDb.outputs.resourceId
  }
}

// Assign Cosmos DB Data Owner role to API App Service for full permissions
resource apiAppCosmosDbOwnerRoleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-05-15' = {
  parent: cosmosDbAccount
  name: guid(subscription().id, resourceGroup().id, apiAppName, 'owner')
  properties: {
    roleDefinitionId: resourceId('Microsoft.DocumentDB/databaseAccounts/sqlRoleDefinitions', cosmosDbAccountName, '00000000-0000-0000-0000-000000000001')
    principalId: apiAppService.outputs.systemAssignedMIPrincipalId
    scope: cosmosDb.outputs.resourceId
  }
}

// ========================================
// Storage Account
// ========================================

module storageAccount 'br/public:avm/res/storage/storage-account:0.14.3' = {
  name: 'storage-account-deployment'
  params: {
    name: storageAccountName
    location: location
    tags: allTags
    
    // Storage account configuration
    kind: 'StorageV2'
    skuName: 'Standard_LRS'
    
    // Security settings
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    
    // Enable blob services
    blobServices: {
      containers: [
        {
          name: storageContainerName
          publicAccess: 'None'
        }
      ]
    }
    
    // RBAC role assignments for the user
    roleAssignments: principalId != '' ? [
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Storage Blob Data Contributor'
        principalType: 'User'
      }
    ] : []
  }
}

// Reference to storage account for role assignments
resource storageAccountResource 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

// Assign Storage Blob Data Contributor role to API App Service
resource apiAppStorageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, resourceGroup().id, apiAppName, 'storage-contributor')
  scope: storageAccountResource
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: apiAppService.outputs.systemAssignedMIPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// ========================================
// Static Web App
// ========================================

module staticWebApp 'br/public:avm/res/web/static-site:0.5.0' = {
  name: 'staticwebapp-deployment'
  params: {
    name: staticWebAppName
    location: 'westeurope'  // Static Web Apps not available in all regions
    tags: union(allTags, {
      'azd-service-name': 'web'
    })
    
    // Use Free tier for development
    sku: 'Free'
    
    // Build configuration
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
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

@description('The storage account name')
output AZURE_STORAGE_ACCOUNT_NAME string = storageAccount.outputs.name

@description('The storage container name')
output AZURE_STORAGE_CONTAINER_NAME string = storageContainerName

@description('The resource group location')
output AZURE_LOCATION string = location

@description('The environment name')
output AZURE_TENANT_ID string = tenant().tenantId

@description('The resource group name')
output AZURE_RESOURCE_GROUP string = resourceGroup().name

@description('The API App Service name')
output API_APP_NAME string = apiAppService.outputs.name

@description('The API App Service endpoint')
output API_ENDPOINT string = 'https://${apiAppService.outputs.defaultHostname}'

@description('The Static Web App name')
output STATIC_WEB_APP_NAME string = staticWebApp.outputs.name

@description('The Static Web App endpoint')
output WEB_APP_URL string = 'https://${staticWebApp.outputs.defaultHostname}'
