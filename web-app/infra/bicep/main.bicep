@description('Name prefix for frontend resources')
param namePrefix string = 'aiinvest'

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Container registry server')
param containerRegistryServer string

@description('Container image')
param containerImage string

@description('CORS allowed origins')
param allowOrigins string[] = ['*']

@description('CPU cores for the container')
param cpuCores int = 1

@description('Memory in GB for the container')
param memoryInGB string = '2Gi'

@description('Backend API URL for frontend configuration')
param backendApiUrl string = ''

@description('Container Apps Environment resource name where the container apps will be deployed')
param containerAppsEnvironment string

@description('User Assigned Identity Resource Name used as identity for the api app')
param userAssignedIdentityName string

@description('Tags for resources')
param tags object = {
  Environment: environment
  Project: 'ai-investment-analysis-sample'
  Component: 'web app'
}

var appName = '${namePrefix}-web-${environment}'

// Environment variables for the frontend
var environmentVariables = !empty(backendApiUrl) ? [
  {
    name: 'VITE_API_BASE_URL'
    value: backendApiUrl
  }
] : []

// Fetch existing User Assigned Identity
resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' existing = {
  scope: resourceGroup()
  name: userAssignedIdentityName
}

resource containerAppsEnvironmentResource 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvironment
  scope: resourceGroup()
}

// Use Azure Verified Module for Container App (Web App)
module webApp 'br:mcr.microsoft.com/bicep/avm/res/app/container-app:0.19.0' = {
  name: 'webAppDeployment'
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
              path: '/'
              port: 8080
            }
            initialDelaySeconds: 5
            periodSeconds: 30
          }
        ]
      }
    ]
    ingressExternal: true
    ingressTargetPort: 8080
    managedIdentities: {
      systemAssigned: false
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


output containerAppName string = webApp.outputs.name
output containerAppUrl string = webApp.outputs.fqdn
output containerAppId string = webApp.outputs.resourceId
