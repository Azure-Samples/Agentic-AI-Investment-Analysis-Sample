# Azure Developer CLI Quick Reference

## Essential Commands

| Command | Description |
|---------|-------------|
| `azd auth login` | Authenticate with Azure |
| `azd init` | Initialize azd in current directory |
| `azd up` | Provision + deploy everything |
| `azd provision` | Provision infrastructure only |
| `azd deploy` | Deploy application code only |
| `azd down` | Delete all Azure resources |

## Environment Management

| Command | Description |
|---------|-------------|
| `azd env new <name>` | Create new environment |
| `azd env list` | List all environments |
| `azd env select <name>` | Switch to environment |
| `azd env get-values` | Show all variables |
| `azd env set <key> <value>` | Set a variable |
| `azd env refresh` | Sync with Azure |

## Service Operations

| Command | Description |
|---------|-------------|
| `azd deploy api` | Deploy API service only |
| `azd deploy web` | Deploy web service only |
| `azd monitor --overview` | Open Azure Portal |
| `azd monitor --logs` | View application logs |
| `azd monitor --live` | Live metrics |

## Pipeline Setup

| Command | Description |
|---------|-------------|
| `azd pipeline config` | Set up CI/CD pipeline |

## Common Workflows

### First Deployment
```bash
azd auth login
azd up
```

### Update Code
```bash
# Make changes...
azd deploy
```

### Update Infrastructure
```bash
# Edit infra/main.bicep...
azd provision
```

### Create Production Environment
```bash
azd env new prod
azd up
```

### Teardown
```bash
azd down --purge
```

## Environment Variables

All automatically available after `azd provision`:

- `AZURE_ENV_NAME`
- `AZURE_LOCATION`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_ACCOUNT_NAME`
- `COSMOS_DB_DATABASE_NAME`
- `COSMOS_DB_KEY`

## File Structure

```
.
├── azure.yaml                 # Service definitions
├── infra/
│   ├── main.bicep            # Infrastructure template
│   └── main.parameters.json  # Parameters
└── .azure/                    # Environment data (git-ignored)
```

## Troubleshooting

```bash
# View detailed output
azd up --debug

# Restore Bicep modules
bicep restore infra/main.bicep

# Refresh environment
azd env refresh

# Check logs
azd monitor --logs
```

## Tips

- Use `azd env` to manage multiple environments (dev/test/prod)
- All Bicep outputs become environment variables (use UPPERCASE_NAMES)
- Post-provision hooks retrieve secrets automatically
- `.azure/` folder is git-ignored (contains secrets)
- Use `azd pipeline config` for CI/CD automation

## Resources

📚 [Full Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
🎯 [Template Gallery](https://azure.github.io/awesome-azd/)
💬 [GitHub Discussions](https://github.com/Azure/azure-dev/discussions)
