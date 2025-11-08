# Mock UI API Integration

The mock UI has been connected to the backend API. Here's what was implemented:

## Changes Made

### 1. API Client (`src/lib/api-client.ts`)
- Created a typed API client with methods for:
  - Getting all opportunities
  - Creating, updating, and deleting opportunities
  - Uploading documents
  - Managing analyses
- Includes proper error handling and timeout management

### 2. API Configuration (`src/lib/api-config.ts`)
- Centralized API endpoint configuration
- Supports environment variable for API URL

### 3. Vite Proxy Configuration (`vite.config.ts`)
- Added proxy to forward `/api` requests to `http://localhost:8084`
- Enables seamless development without CORS issues

### 4. Updated Pages
- **Index.tsx**: Now fetches opportunities from the API instead of using mock data
- **NewOpportunity.tsx**: Creates opportunities via API and uploads documents
- **Analysis.tsx**: Fetches opportunity details, documents, and analyses from API; creates new analysis runs
- **ProcessDocuments.tsx**: Fetches opportunities and documents from API; triggers document processing workflow

### 5. Environment Variables (`.env.local`)
- `VITE_API_URL`: Backend API URL (defaults to `http://localhost:8084`)

## Running the Application

### Prerequisites
1. Ensure the API server is running on port 8084
2. Install dependencies: `npm install`

### Development Mode
```bash
npm run dev
```

The UI will run on `http://localhost:8080` and proxy API calls to the backend.

### API Requirements
The backend API should be running with the following endpoints:
- `GET /api/opportunity/opportunities` - List all opportunities
- `GET /api/opportunity/opportunities/{id}` - Get specific opportunity
- `POST /api/opportunity/opportunities` - Create a new opportunity
- `PUT /api/opportunity/opportunities/{id}` - Update an opportunity
- `DELETE /api/opportunity/opportunities/{id}` - Delete an opportunity
- `POST /api/opportunity/opportunities/{id}/documents/upload` - Upload documents
- `GET /api/opportunity/opportunities/{id}/documents` - Get opportunity documents
- `POST /api/opportunity/opportunities/{id}/documents/process` - Process documents with AI agents
- `GET /api/analysis` - List all analyses
- `GET /api/analysis/opportunity/{id}` - Get analyses for an opportunity
- `POST /api/analysis` - Create a new analysis
- `POST /api/analysis/{opportunity_id}/{analysis_id}/start` - Start an analysis workflow

## Data Mapping

The API uses different field names than the UI mockup. The mapping is:

| UI Field | API Field | Location |
|----------|-----------|----------|
| name | display_name | Opportunity |
| company | settings.company | Opportunity.settings |
| stage | settings.stage | Opportunity.settings |
| amount | settings.amount | Opportunity.settings |
| score | settings.score | Opportunity.settings |
| documentsCount | settings.documentsCount | Opportunity.settings |

## Next Steps

To fully integrate the mock UI with the API:
1. ✅ Update the Index page to fetch opportunities from API
2. ✅ Update the NewOpportunity page to create opportunities and upload documents
3. ✅ Update the Analysis page to fetch and display analysis data
4. ✅ Update the ProcessDocuments page to work with real document data
5. Implement real-time updates using Server-Sent Events (SSE) for document processing and analysis progress
6. Update the Upload page (if needed) to handle file uploads
7. Add authentication if required by the API
8. Handle pagination for large datasets
9. Add proper error boundaries and retry logic
10. Implement WebSocket connections for real-time workflow updates
