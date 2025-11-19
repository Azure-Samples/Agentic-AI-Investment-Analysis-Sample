@description('Name prefix for resources')
@minLength(4)
param namePrefix string = 'aiinvest'

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Container Apps Environment resource name where the container apps will be deployed')
param containerAppsEnvironmentName string

@description('Container Registry Server')
param containerRegistryServer string

@description('Container image for the backend app')
param containerImage string

// API env vars related parameters
@description('Cosmos DB account endpoint')
param cosmosAccountEndpoint string

@description('Cosmos DB database name')
param cosmosDbName string

@description('Storage Account name')
param storageAccountName string


// API App related parameters

@description('CORS allowed origins')
param allowOrigins string[] = ['*']

@description('CPU cores for the container')
param cpuCores int = 1

@description('Memory in GB for the container')
param memoryInGB string = '2Gi'

@description('User Assigned Identity Resource Name used as identity for the api app')
param userAssignedIdentityName string

@description('Additional environment variables')
param additionalEnvironmentVariables array = []

@description('Tags for resources')
param tags object = {}

var appName = '${namePrefix}-api-${environment}'

// Prepare environment variables
var environmentVariables = concat([
  {
    name: 'COSMOS_DB_ENDPOINT'
    value: cosmosAccountEndpoint
  }
  {
    name: 'COSMOS_DB_DATABASE_NAME'
    value: cosmosDbName
  }
  {
    name :'AZURE_STORAGE_ACCOUNT_NAME'
    value: storageAccountName
  }
  {
    name :'AZURE_OPENAI_ENDPOINT'
    value: ''
  }
  {
    name :'AZURE_OPENAI_DEPLOYMENT_NAME'
    value: ''
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: userAssignedIdentity.properties.clientId
  }
], additionalEnvironmentVariables)


// Fetch existing User Assigned Identity
resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' existing = {
  scope: resourceGroup()
  name: userAssignedIdentityName
}

// Fetch existing Container Apps Environment
resource containerAppsEnvironmentResource 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvironmentName
  scope: resourceGroup()
}

// Use Azure Verified Module for Container App
module apiApp 'br:mcr.microsoft.com/bicep/avm/res/app/container-app:0.19.0' = {
  name: 'apiAppDeployment'
  params: {
    name: appName
    location: containerAppsEnvironmentResource.location
    tags: tags
    environmentResourceId: containerAppsEnvironmentResource.id
    corsPolicy: {
      allowCredentials: true
      allowedOrigins: allowOrigins
      allowedMethods: ['*']
      allowedHeaders: ['*']
    }
    ingressAllowInsecure: false
    containers: [
      {
        name: appName
        image: containerImage
        resources: {
          cpu: cpuCores
          memory: memoryInGB
        }
        env: environmentVariables
        probes: [
          {
            type: 'Liveness'
            httpGet: {
              path: '/health'
              port: 8090
            }
            initialDelaySeconds: 5
            periodSeconds: 60
          }
        ]
      }
    ]
    ingressExternal: true
    ingressTargetPort: 8090
    managedIdentities: {
      userAssignedResourceIds: [ userAssignedIdentity.id ]
    }
    registries: [
      {
        server: containerRegistryServer
        identity: userAssignedIdentity.id
      }
    ]
    scaleSettings: {
      minReplicas: 1
      maxReplicas: 1
      rules: [ 
        {
          name: 'http-scaler'
          http: {
            metadata: {
              concurrentRequests: '10'
            }
          }
        }
      ]
    }
  }
}

output containerAppName string = apiApp.outputs.name
output containerAppUrl string = apiApp.outputs.fqdn
output containerAppId string = apiApp.outputs.resourceId
