# Agentic AI Investment Analysis Sample

An intelligent investment analysis application powered by Azure AI and multi-agent workflows. This sample demonstrates how to build AI-powered applications that can process documents, analyze investment opportunities, and provide actionable insights.

## Features

- 🤖 **Multi-Agent Workflow**: Coordinated AI agents for comprehensive investment analysis
- 📄 **Document Processing**: Automated extraction and analysis of investment documents
- 💹 **Investment Insights**: AI-generated analysis and recommendations
- 🔐 **Secure by Design**: Azure-native security with Managed Identity support
- 🚀 **Azure Developer CLI**: One-command deployment with `azd`

## Architecture

- **API Backend** (`api-app/`): Python FastAPI application
- **Web Frontend** (`web-app/`): React TypeScript application
- **Infrastructure** (`infra/`): Azure Bicep templates
- **Database**: Azure Cosmos DB (NoSQL)

## Quick Start

### Prerequisites

- [Azure Developer CLI (azd)](https://aka.ms/azd/install)
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

### Deploy to Azure

1. **Clone and initialize:**
   ```bash
   git clone <repository-url>
   cd Agentic-AI-Investment-Analysis-Sample
   azd auth login
   ```

2. **Provision and deploy:**
   ```bash
   azd up
   ```

   This single command will:
   - Provision Azure Cosmos DB
   - Deploy the API backend
   - Deploy the web frontend
   - Configure all environment variables

3. **Access your application:**
   ```bash
   azd env get-values
   ```

### Local Development

1. **Set up the API:**
   ```bash
   cd api-app
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up the Web App:**
   ```bash
   cd web-app
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy from azd environment or create .env file
   azd env get-values > .env
   ```

4. **Run locally:**
   ```bash
   # Terminal 1 - API
   cd api-app
   python main.py

   # Terminal 2 - Web
   cd web-app
   npm run dev
   ```

## Project Structure

```
.
├── azure.yaml              # Azure Developer CLI configuration
├── infra/                  # Infrastructure as Code (Bicep)
│   ├── main.bicep         # Main infrastructure template
│   ├── main.parameters.json
│   └── abbreviations.json
├── api-app/               # Python FastAPI backend
│   ├── app/
│   │   ├── routers/       # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── models/        # Data models
│   │   ├── database/      # Database repositories
│   │   └── workflow/      # AI agent workflows
│   └── requirements.txt
└── web-app/               # React TypeScript frontend
    ├── src/
    │   ├── components/    # UI components
    │   └── pages/         # Application pages
    └── package.json
```

## Infrastructure

The application uses the following Azure resources:

- **Azure Cosmos DB**: NoSQL database for storing opportunities, documents, analysis, and users
  - Serverless mode for cost-effective development
  - Continuous backup with 30-day retention
  - Session consistency level

For detailed infrastructure documentation, see [infra/README.md](infra/README.md).

## Key Commands

```bash
# Provision infrastructure only
azd provision

# Deploy application only
azd deploy

# View environment variables
azd env get-values

# Monitor application
azd monitor --overview

# Clean up resources
azd down
```

## Development Workflow

1. Make changes to your code
2. Test locally using the local development setup
3. Deploy to Azure:
   ```bash
   azd deploy
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Resources

- [Azure Developer CLI Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
