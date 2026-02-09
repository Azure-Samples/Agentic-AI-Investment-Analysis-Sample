# Agents.md - Agentic AI Investment Analysis System

## 📚 Technical Stack

### Backend Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Python** | Core backend language | 3.11+ |
| **FastAPI** | Modern async web framework | 0.116.1 |
| **Microsoft Agent Framework** | Multi-agent workflow orchestration | Latest |
| **Uvicorn** | ASGI server | 0.35.0 |
| **Pydantic** | Data validation and settings management | 2.11.7 |
| **Azure SDK** | Azure service integrations | Latest |

### Frontend Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI framework | 18.x |
| **TypeScript** | Type-safe JavaScript | 5.x |
| **Vite** | Build tool and dev server | Latest |
| **Shadcn/UI** | Component library | Latest |
| **Tailwind CSS** | Utility-first CSS framework | Latest |
| **Lucide React** | Icon library | 0.462.0 |
| **TanStack Query** | Data fetching and caching | 5.56.2 |

### Azure Cloud Services

| Service | Purpose |
|---------|---------|
| **Azure OpenAI** | LLM provider for AI agents |
| **Azure Cosmos DB** | NoSQL database for documents, opportunities, and analyses |
| **Azure Blob Storage** | Document and file storage |
| **Azure Container Apps** | Containerized application hosting |
| **Azure Container Registry** | Docker image storage |
| **Azure Application Insights** | Application monitoring and telemetry |
| **Azure Log Analytics** | Centralized logging |
| **Azure App Configuration** | Configuration management |

### Infrastructure as Code

| Technology | Purpose |
|-----------|---------|
| **Bicep** | Azure infrastructure definition |
| **Bash Scripts** | Deployment automation |
| **Docker** | Application containerization |

---

## 📁 Repository Structure

### Root Directory

```
Agentic-AI-Investment-Analysis-Sample/
├── CODE_OF_CONDUCT.md      # Community guidelines
├── LICENSE                  # Project license
├── README.md               # Project overview and setup instructions
├── SUPPORT.md              # Support and contribution guidelines
├── _assets/                # Documentation and sample assets
├── api-app/                # Backend API application
├── infra/                  # Infrastructure deployment scripts
└── web-app/                # Frontend web application
```

---

### `_assets/` - Documentation Assets

Contains documentation assets, architecture diagrams, and sample analysis hypotheses.

```
_assets/
├── analysis-hypothesis-*.txt           # Sample analysis outputs for different companies
├── ARCHITECTURE_DIAGRAM.md            # Detailed system architecture documentation
├── README-sample-hypotheses.md        # Guide to sample hypothesis files
└── agentframework.svg                 # Microsoft Agent Framework logo
```

**Purpose**: Houses all non-code assets including sample data, architectural documentation, and visual aids for understanding the system.

---

### `api-app/` - Backend API Application

The FastAPI-based backend that orchestrates AI agents and manages data operations.

```
api-app/
├── Dockerfile                         # Container definition for API
├── main.py                           # FastAPI application entry point
├── requirements.txt                  # Python dependencies
├── run_investment_workflow.py        # Standalone workflow execution script
├── run_what_if_chat.py              # Standalone what-if chat script
├── app/                             # Main application package
└── infra/                           # Backend-specific infrastructure
```

#### `api-app/app/` - Application Core

**`app/core/`** - Core Configuration and Security
```
core/
├── __init__.py
├── auth.py           # Authentication and authorization logic
└── config.py         # Application configuration and settings
```

**`app/database/`** - Data Access Layer
```
database/
├── cosmos.py                    # Azure Cosmos DB client setup
└── repositories/                # Data access repositories
```
*Purpose*: Manages database connections and implements repository pattern for data access.

**`app/models/`** - Data Models
```
models/
├── __init__.py
├── _analysis_workflow_event.py   # Workflow event model
├── _analysis.py                  # Investment analysis model
├── _base.py                      # Base model classes
├── _document.py                  # Document model
├── _opportunity.py               # Investment opportunity model
├── _stream_event_message.py      # SSE stream event model
├── _user.py                      # User model
└── _what_if_message.py          # What-if chat message model
```
*Purpose*: Pydantic models for type-safe data validation and serialization/deserialization.

**`app/routers/`** - API Endpoints
```
routers/
├── analysis.py          # Analysis workflow endpoints (/analysis/*)
├── chat.py             # What-if chat endpoints (/chat/*)
├── oldchat_api.py      # Legacy chat API
└── opportunity.py      # Opportunity CRUD endpoints (/opportunities/*)
```
*Purpose*: FastAPI routers defining REST API endpoints. Handles request validation, response formatting, and error handling.

**Key Endpoints:**
- `POST /opportunities/{opportunity_id}/analyses/{analysis_id}/start/{client_id}` - Start analysis workflow
- `GET /opportunities/{opportunity_id}/analyses/{analysis_id}/stream/{client_id}` - SSE stream for real-time updates
- `POST /opportunities/{opportunity_id}/what-if/chat/{client_id}` - Interactive what-if scenario chat
- `POST /opportunities` - Create investment opportunity
- `GET /opportunities` - List opportunities

**`app/services/`** - Business Logic Layer
```
services/
├── __init__.py
├── analysis_service.py                      # Analysis CRUD operations
├── analysis_workflow_events_service.py      # Event persistence and retrieval
├── analysis_workflow_executor_service.py    # Workflow orchestration and execution
├── document_processing_service.py           # Multi-stage document processing
├── document_service.py                      # Document CRUD operations
├── opportunity_service.py                   # Opportunity management
├── user_service.py                         # User management
└── whatif_workflow_executor_service.py     # What-if chat workflow execution
```
*Purpose*: Service layer implementing business logic, orchestrating workflows, and coordinating between routers and data access layers.

**`app/utils/`** - Utility Functions
```
utils/
├── ag_ui_event_converters.py      # Convert Agent Framework events to UI events
├── blob_storage.py                # Azure Blob Storage helpers
├── credential.py                  # Azure credential management
├── logging.py                     # Logging configuration
└── sse_stream_event_queue.py      # SSE event queue management
```
*Purpose*: Shared utilities and helper functions for common operations.

**`app/what_if_chat/`** - What-If Scenario System
```
what_if_chat/
├── __init__.py
├── what_if_executors.py      # What-if scenario agents
├── what_if_models.py         # What-if specific data models
└── what_if_workflow.py       # What-if chat workflow definition
```
*Purpose*: Implements the interactive chat system for exploring hypothetical investment scenarios.

**Key Components:**
- **WhatIfChatExecutor**: Main chat agent that handles scenario questions
- **WhatIfWorkflow**: Orchestrates the chat conversation flow
- Supports streaming responses for real-time interaction

**`app/workflow/`** - Investment Analysis Workflow
```
workflow/
├── __init__.py
├── investment_executors.py      # Individual agent implementations
├── investment_models.py         # Workflow-specific data models
├── investment_workflow.py       # Main workflow orchestration
└── prompts/                    # Agent prompt templates
    ├── analysis_aggregator.md
    ├── compliance_analyst.md
    ├── data_preparation.md
    ├── debate_challenger.md
    ├── debate_supporter.md
    ├── financial_analyst.md
    ├── market_analyst.md
    ├── risk_analyst.md
    └── summary_report.md
```
*Purpose*: Core multi-agent investment analysis system using Microsoft Agent Framework.

**Agent Architecture:**
```
DataPreparationExecutor
    ↓
[Financial Analyst] [Risk Analyst] [Market Analyst] [Compliance Analyst]
    ↓ (Fan-in)
AnalysisAggregator
    ↓
InvestmentDebateWorkflowExecutor
    - DebateSupporter
    - DebateChallenger
    ↓
SummaryReportGenerator
```

**Agent Roles:**
- **DataPreparationExecutor**: Prepares and structures input data
- **FinancialAnalyst**: Analyzes financial statements and projections
- **RiskAnalyst**: Evaluates investment risks and mitigation strategies
- **MarketAnalyst**: Assesses market conditions and competitive landscape
- **ComplianceAnalyst**: Reviews regulatory and legal compliance
- **AnalysisAggregator**: Combines insights from all analysts
- **DebateSupporter/Challenger**: Debate analysis from different perspectives
- **SummaryReportGenerator**: Creates final investment recommendation

---

### `infra/` - Infrastructure Deployment

Infrastructure as Code (IaC) for Azure deployment.

```
infra/
├── 1-deploy-azure-infra.sh        # Step 1: Deploy Azure resources
├── 2-build-and-push-images.sh     # Step 2: Build and push Docker images
├── 3-deploy-apps.sh              # Step 3: Deploy applications to Azure
└── bicep/                        # Bicep infrastructure templates
    ├── main.bicep                # Main orchestration template
    └── modules/                  # Modular Bicep templates
        ├── ai-foundry.bicep              # Azure AI Foundry setup
        ├── app-config-store.bicep        # App Configuration
        ├── app-insights.bicep            # Application Insights
        ├── container-apps-environment.bicep  # Container Apps environment
        ├── container-registry.bicep      # Container Registry
        ├── cosmos-db.bicep              # Cosmos DB setup
        ├── log-analytics-ws.bicep       # Log Analytics workspace
        └── storage.bicep                # Blob Storage setup
```

**Deployment Process:**
1. Run `1-deploy-azure-infra.sh` - Provisions all Azure resources
2. Run `2-build-and-push-images.sh` - Builds Docker images and pushes to ACR
3. Run `3-deploy-apps.sh` - Deploys containers to Azure Container Apps

---

### `web-app/` - Frontend Web Application

Modern React-based single-page application.

```
web-app/
├── Dockerfile                    # Container definition for web app
├── package.json                  # NPM dependencies and scripts
├── vite.config.ts               # Vite build configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── index.html                   # Entry HTML file
├── infra/                       # Frontend-specific infrastructure
│   └── bicep/
├── public/                      # Static assets
└── src/                        # Application source code
    ├── App.tsx                  # Root application component
    ├── main.tsx                 # Application entry point
    ├── components/              # Reusable UI components
    ├── hooks/                   # Custom React hooks
    ├── lib/                     # Utility libraries and helpers
    └── pages/                   # Page components (routes)
```

#### `web-app/src/` - Source Code Structure

**`src/components/`** - Reusable UI Components
- **ui/**: Shadcn/UI component library (buttons, dialogs, forms, etc.)
- **custom/**: Application-specific components
  - Document upload components
  - Analysis progress visualizers
  - Workflow diagram renderers
  - Chat interfaces

**`src/hooks/`** - Custom React Hooks
- API integration hooks (using TanStack Query)
- SSE streaming hooks for real-time updates
- Authentication and authorization hooks
- State management hooks

**`src/lib/`** - Utility Libraries
- API client configuration
- Type utilities
- Helper functions
- Constants and enums

**`src/pages/`** - Page Components
```
pages/
├── Index.tsx                    # Landing/dashboard page
├── NewOpportunity.tsx          # Create investment opportunity
├── EditOpportunity.tsx         # Edit existing opportunity
├── ProcessDocuments.tsx        # Document upload and processing
├── Analysis.tsx                # Analysis execution and visualization
└── WhatIfChat.tsx             # What-if scenario chat interface
```

**Key Features:**
- **Real-time Updates**: SSE integration for streaming agent progress
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript coverage
- **Component Library**: Shadcn/UI for consistent, accessible components
- **State Management**: TanStack Query for server state
- **Routing**: React Router for navigation

---

## 🎯 Data Flow Architecture

### Analysis Workflow Execution Flow

```
1. User starts analysis (web-app)
   ↓
2. POST /analyses/{id}/start/{client_id} (api-app/routers/analysis.py)
   ↓
3. Analysis marked as running (api-app/services/analysis_service.py)
   ↓
4. Background task spawned (FastAPI BackgroundTasks)
   ↓
5. Workflow executor initializes agents (api-app/services/analysis_workflow_executor_service.py)
   ↓
6. Investment workflow runs with event streaming (api-app/workflow/investment_workflow.py)
   ↓
7. Events pushed to SSE queue (api-app/utils/sse_stream_event_queue.py)
   ↓
8. Client receives real-time events via GET /stream/{client_id}
   ↓
9. Results persisted to Cosmos DB
   ↓
10. Analysis marked as completed
```

### Document Processing Flow

```
1. User uploads documents (web-app)
   ↓
2. Files sent to POST /documents (api-app/routers/documents.py)
   ↓
3. Documents stored in Azure Blob Storage (api-app/utils/blob_storage.py)
   ↓
4. Document metadata saved to Cosmos DB (api-app/services/document_service.py)
   ↓
5. Multi-stage processing initiated (api-app/services/document_processing_service.py)
   - Text extraction
   - Chunking
   - Embedding generation
   ↓
6. Processed documents available for analysis workflows
```

---

## 🔧 Development Commands

### Backend (api-app/)
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Run standalone workflow
python run_investment_workflow.py

# Run standalone what-if chat
python run_what_if_chat.py
```

### Frontend (web-app/)
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Infrastructure (infra/)
```bash
# Deploy all infrastructure
./1-deploy-azure-infra.sh

# Build and push images
./2-build-and-push-images.sh

# Deploy applications
./3-deploy-apps.sh
```

---

## 📊 Key Design Patterns

### Multi-Agent Orchestration
- **Fan-out/Fan-in**: Parallel execution of analyst agents, aggregated results
- **Sequential Processing**: Data preparation → Analysis → Debate → Summary
- **Event-Driven**: Workflow events streamed in real-time via SSE

### Backend Architecture
- **Repository Pattern**: Data access abstraction via repositories
- **Service Layer**: Business logic separated from API endpoints
- **Dependency Injection**: FastAPI's dependency system for service instantiation
- **Background Tasks**: Long-running workflows in background threads

### Frontend Architecture
- **Component-Based**: Reusable React components with Shadcn/UI
- **Server State Management**: TanStack Query for API data
- **Real-Time Updates**: EventSource API for SSE streaming
- **Type Safety**: TypeScript for compile-time type checking

---

## 🔐 Security Considerations

- **Authentication**: Azure AD integration (implemented in `app/core/auth.py`)
- **Authorization**: Role-based access control for resources
- **Secrets Management**: Azure App Configuration for sensitive data
- **Network Security**: Azure Container Apps with built-in security
- **Data Encryption**: At-rest and in-transit encryption via Azure services

---

## 📈 Monitoring and Observability

- **Application Insights**: Distributed tracing and performance monitoring
- **Log Analytics**: Centralized logging from all components
- **Custom Logging**: Structured logging in application code (`app/utils/logging.py`)
- **Event Persistence**: All workflow events stored for audit and replay
- **Health Checks**: Built-in endpoint monitoring

---

## 🚀 Scalability Features

- **Async/Await**: Non-blocking I/O throughout the backend
- **Container Apps**: Auto-scaling based on load
- **Cosmos DB**: Global distribution and automatic scaling
- **Event Streaming**: Efficient SSE for real-time updates without polling
- **Background Processing**: Workflow execution doesn't block API requests

---

This document provides a comprehensive overview of the Agentic AI Investment Analysis System's technical architecture, repository structure, and key design decisions. For detailed setup instructions, see [README.md](README.md). For architectural diagrams, see [_assets/ARCHITECTURE_DIAGRAM.md](_assets/ARCHITECTURE_DIAGRAM.md).
