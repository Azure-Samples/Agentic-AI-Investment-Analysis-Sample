# Azure Developer CLI (azd) Setup Guide

This document explains how the project is configured for Azure Developer CLI (azd) compatibility.

## What is azd?

Azure Developer CLI (azd) is a developer-centric command-line tool that simplifies:
- Provisioning Azure resources
- Deploying applications
- Managing environments
- Setting up CI/CD pipelines

## Project Structure for azd

```
Agentic-AI-Investment-Analysis-Sample/
├── azure.yaml                    # azd configuration (required)
├── infra/                        # Infrastructure as Code (required)
│   ├── main.bicep               # Main Bicep template
│   ├── main.parameters.json     # Parameters with azd placeholders
│   └── abbreviations.json       # Resource naming conventions
├── api-app/                      # Python API service
└── web-app/                      # React web service
```

## Key Files

### azure.yaml

Located at the root, this file:
- Defines services (`api` and `web`)
- Specifies languages and hosting platforms
- Configures post-provision hooks to retrieve Cosmos DB keys

```yaml
name: agentic-ai-investment-analysis
services:
  api:
    project: ./api-app
    language: py
    host: appservice
  web:
    project: ./web-app
    language: js
    host: staticwebapp
```

### infra/main.bicep

The infrastructure template follows azd conventions:

**Required Parameters:**
- `environmentName`: Name of the azd environment (e.g., "dev", "prod")
- `location`: Azure region for deployment
- `principalId`: User/service principal for RBAC assignments

**Outputs:**
- Use uppercase with underscores: `COSMOS_DB_ENDPOINT`, `COSMOS_DB_ACCOUNT_NAME`
- Automatically available as environment variables in your app

### infra/main.parameters.json

Uses azd token replacement syntax:
```json
{
  "environmentName": {
    "value": "${AZURE_ENV_NAME}"
  },
  "location": {
    "value": "${AZURE_LOCATION}"
  }
}
```

These tokens are replaced at deployment time by azd.

## azd Workflow

### First Time Setup

```bash
# 1. Authenticate with Azure
azd auth login

# 2. Initialize environment (if not already done)
azd init

# 3. Deploy everything
azd up
```

### Development Workflow

```bash
# Make code changes...

# Deploy just the code (infrastructure unchanged)
azd deploy

# Or deploy a specific service
azd deploy api
azd deploy web
```

### Infrastructure Changes

```bash
# Update infra/main.bicep...

# Provision infrastructure only
azd provision
```

### Environment Management

```bash
# List environments
azd env list

# Switch environments
azd env select

# View all environment variables
azd env get-values

# Set a variable
azd env set MY_VAR "value"
```

## Environment Variables

After `azd up` or `azd provision`, these variables are automatically available:

| Variable | Source | Description |
|----------|--------|-------------|
| `AZURE_ENV_NAME` | azd | Environment name |
| `AZURE_LOCATION` | azd | Azure region |
| `AZURE_SUBSCRIPTION_ID` | azd | Your subscription |
| `AZURE_RESOURCE_GROUP` | azd | Created resource group |
| `COSMOS_DB_ENDPOINT` | Bicep output | Cosmos DB endpoint URL |
| `COSMOS_DB_ACCOUNT_NAME` | Bicep output | Cosmos DB account name |
| `COSMOS_DB_DATABASE_NAME` | Bicep output | Database name |
| `COSMOS_DB_KEY` | Post-provision hook | Primary access key |

Access them in your application:

**Python:**
```python
import os
endpoint = os.getenv('COSMOS_DB_ENDPOINT')
```

**Node.js:**
```javascript
const endpoint = process.env.COSMOS_DB_ENDPOINT;
```

## Post-Provision Hooks

The `azure.yaml` includes hooks that run after provisioning:

```yaml
hooks:
  postprovision:
    windows:
      shell: pwsh
      run: |
        # Retrieve Cosmos DB key and store it
        $cosmosAccountName = azd env get-values --output json | ConvertFrom-Json | Select-Object -ExpandProperty COSMOS_DB_ACCOUNT_NAME
        $rgName = azd env get-values --output json | ConvertFrom-Json | Select-Object -ExpandProperty AZURE_RESOURCE_GROUP
        $cosmosKey = az cosmosdb keys list --name $cosmosAccountName --resource-group $rgName --query primaryMasterKey -o tsv
        azd env set COSMOS_DB_KEY $cosmosKey
```

This automatically retrieves secrets that can't be output directly from Bicep.

## CI/CD Integration

azd can generate GitHub Actions or Azure DevOps pipelines:

```bash
# For GitHub Actions
azd pipeline config

# Follow the prompts to:
# 1. Create a service principal
# 2. Generate workflow files
# 3. Set up repository secrets
```

## Multiple Environments

Manage dev, test, and prod separately:

```bash
# Create dev environment
azd env new dev
azd up

# Create prod environment
azd env new prod
azd up

# Switch between them
azd env select dev
azd env select prod
```

Each environment has:
- Separate resource groups
- Independent configuration
- Isolated resources

## Cost Optimization

The template uses:
- **Serverless Cosmos DB**: Pay only for what you use
- **No always-on compute**: App Service and Static Web Apps scale to zero

Estimated monthly cost for dev: **$5-20** (varies by usage)

## Troubleshooting

### "azd: command not found"

Install azd: https://aka.ms/azd/install

### Module restore errors

```bash
bicep restore infra/main.bicep
```

### Environment out of sync

```bash
azd env refresh
```

### View detailed logs

```bash
azd up --debug
azd provision --debug
```

## Best Practices

1. **Use environments**: Separate dev, test, prod with `azd env`
2. **Version control**: Commit `azure.yaml`, `infra/`, `.gitignore` (but not `.azure/`)
3. **Secrets management**: Use Key Vault for production secrets
4. **Resource naming**: Let azd generate unique names via `resourceToken`
5. **Tags**: Use `azd-env-name` tag (automatically added) for cost tracking

## Next Steps

- Set up CI/CD with `azd pipeline config`
- Add more Azure services (Key Vault, App Insights, etc.)
- Configure custom domains
- Enable Managed Identity for passwordless auth
- Add staging slots for zero-downtime deployments

## Resources

- [azd Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
- [azd Templates Gallery](https://azure.github.io/awesome-azd/)
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
