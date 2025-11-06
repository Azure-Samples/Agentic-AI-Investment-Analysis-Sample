# Azure Infrastructure Deployment

This directory contains Bicep templates for deploying the Azure infrastructure required for the Investment Analysis application. The infrastructure is fully compatible with **Azure Developer CLI (azd)** for streamlined provisioning and deployment.

## Prerequisites

- **Azure Developer CLI (azd)** installed - [Install azd](https://aka.ms/azd/install)
- Azure CLI installed and authenticated (`az login`)
- Azure subscription with appropriate permissions to create resources

## Resources Deployed

- **Azure Cosmos DB Account** (NoSQL/SQL API)
  - Database: `ai-investment-analysis-sample`
  - Containers: `opportunities`, `documents`, `analysis`, `users`
  - Serverless mode for cost-effective development
  - Continuous backup (30 days retention)
  - Session consistency level

## Quick Start with Azure Developer CLI (azd)

The simplest way to deploy this application is using `azd`:

### 1. Initialize the Environment

```bash
# Initialize a new azd environment
azd init

# Or if already initialized, authenticate
azd auth login
```

### 2. Provision and Deploy

```bash
# Provision infrastructure and deploy application in one command
azd up
```

This single command will:
- Create a new resource group
- Deploy the Cosmos DB infrastructure
- Configure environment variables
- Retrieve and store connection secrets

### 3. Access Your Deployment

```bash
# View all environment values including connection strings
azd env get-values

# Open the Azure Portal to view resources
azd monitor --overview
```

## Manual Deployment (Without azd)

## Manual Deployment (Without azd)

If you prefer not to use azd, you can deploy manually:

### 1. Create a Resource Group

```bash
az group create --name rg-investment-analysis --location eastus
```

### 2. Deploy the Infrastructure

```bash
az deployment group create \
  --resource-group rg-investment-analysis \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json \
  --parameters environmentName=myenv location=eastus
```

### 3. Retrieve Deployment Outputs

```bash
az deployment group show \
  --resource-group rg-investment-analysis \
  --name main \
  --query properties.outputs
```

## Azure Developer CLI Commands

### Environment Management

```bash
# List all environments
azd env list

# Select an environment
azd env select

# View environment variables
azd env get-values

# Set a specific environment variable
azd env set VARIABLE_NAME "value"
```

### Infrastructure Operations

```bash
# Provision infrastructure only (no deployment)
azd provision

# Deploy application code only (infrastructure must exist)
azd deploy

# Tear down all resources
azd down
```

### Monitoring and Debugging

```bash
# Open Azure Portal to resource group
azd monitor --overview

# View application logs
azd monitor --logs

# View live metrics
azd monitor --live
```

## Configuration

### azd Environment Variables

The following environment variables are automatically set by `azd`:

- `AZURE_ENV_NAME`: Name of your azd environment
- `AZURE_LOCATION`: Azure region for resources
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID
- `AZURE_RESOURCE_GROUP`: Created resource group name
- `COSMOS_DB_ACCOUNT_NAME`: Cosmos DB account name
- `COSMOS_DB_ENDPOINT`: Cosmos DB endpoint URL
- `COSMOS_DB_DATABASE_NAME`: Database name
- `COSMOS_DB_KEY`: Primary access key (set via post-provision hook)

### Customizing Deployment

Edit `azure.yaml` in the root directory to customize:

- Services configuration
- Build and deployment settings
- Pre/post deployment hooks

Edit `infra/main.bicep` to customize infrastructure:

- Cosmos DB settings (consistency, backup, networking)
- Additional Azure resources

## Updating Your Application Configuration

When using `azd`, environment variables are automatically set. Access them in your application:

**Python (api-app):**
```python
import os

cosmos_endpoint = os.getenv('COSMOS_DB_ENDPOINT')
cosmos_key = os.getenv('COSMOS_DB_KEY')
cosmos_database = os.getenv('COSMOS_DB_DATABASE_NAME')
```

**Manual deployment - retrieve values:**
```bash
# Get the Cosmos DB endpoint
COSMOS_DB_ENDPOINT=$(az deployment group show \
  --resource-group rg-investment-analysis \
  --name main \
  --query properties.outputs.COSMOS_DB_ENDPOINT.value -o tsv)

# Get the Cosmos DB account name
COSMOS_DB_ACCOUNT=$(az deployment group show \
  --resource-group rg-investment-analysis \
  --name main \
  --query properties.outputs.COSMOS_DB_ACCOUNT_NAME.value -o tsv)

# Get the Cosmos DB primary key
COSMOS_DB_KEY=$(az cosmosdb keys list \
  --resource-group rg-investment-analysis \
  --name $COSMOS_DB_ACCOUNT \
  --query primaryMasterKey -o tsv)

echo "COSMOS_DB_ENDPOINT=$COSMOS_DB_ENDPOINT"
echo "COSMOS_DB_KEY=$COSMOS_DB_KEY"
echo "COSMOS_DB_DATABASE_NAME=ai-investment-analysis-sample"
```

## Security Considerations

### For Production Deployments

1. **Enable Private Endpoints**: Update `networkRestrictions.publicNetworkAccess` to `Disabled` in `main.bicep` and configure private endpoints
2. **Use Managed Identity**: Set `disableLocalAuthentication` to `true` and configure your application to use Managed Identity
3. **Restrict IP Access**: Add allowed IP addresses to `networkRestrictions.ipRules`
4. **Enable Multi-Region**: Add additional failover locations for high availability
5. **Enable Zone Redundancy**: Set `isZoneRedundant: true` for production resilience

### Best Practices

- Use Azure Key Vault for storing connection keys (azd can integrate automatically)
- Use Azure RBAC roles for Cosmos DB access instead of keys
- Enable Azure Defender for Cosmos DB
- Review and adjust throughput settings based on actual usage
- Use `azd` environments to manage dev/test/prod configurations separately

## Clean Up

### Using azd

```bash
# Delete all resources and the environment
azd down --purge
```

### Manual cleanup

```bash
az group delete --name rg-investment-analysis --yes --no-wait
```

## Troubleshooting

### Module Not Found Error

If you see "The artifact with reference 'br:mcr.microsoft.com/bicep/avm/res/document-db/database-account:0.18.0' has not been restored":

```bash
bicep restore infra/main.bicep
```

### azd Login Issues

```bash
# Clear auth cache and re-login
azd auth logout
azd auth login
```

### Deployment Validation

Validate the template without deploying:

```bash
# Using azd
azd provision --preview

# Using Azure CLI
az deployment group validate \
  --resource-group rg-investment-analysis \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

### View Deployment Logs

```bash
# Using azd
azd provision --debug

# Using Azure CLI
az deployment group show \
  --resource-group rg-investment-analysis \
  --name main
```

### Environment Variable Issues

```bash
# List all azd environment variables
azd env get-values

# Refresh environment from Azure
azd env refresh
```

## Additional Resources

- [Azure Developer CLI Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Verified Modules](https://aka.ms/avm)
- [azd Templates Gallery](https://azure.github.io/awesome-azd/)
