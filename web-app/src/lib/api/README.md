# API Client Library

This folder contains a comprehensive TypeScript client for the Investment Analysis API. The client provides type-safe methods for all API endpoints with proper error handling, file uploads, and Server-Sent Events (SSE) support.

## Structure

```
api/
├── index.ts          # Main export file
├── client.ts         # Base API client with HTTP methods
├── types.ts          # TypeScript type definitions
├── opportunities.ts  # Opportunity endpoints
├── documents.ts      # Document endpoints
└── analysis.ts       # Analysis endpoints
```

## Configuration

The API client can be configured via environment variables:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

If not set, it defaults to `http://localhost:8000/api`.

## Usage

### Import

```typescript
import { opportunities, documents, analysis } from '@/lib/api';
// Or import specific functions
import { getOpportunities, createOpportunity } from '@/lib/api/opportunities';
```

### Opportunities

```typescript
// Get all active opportunities
const opps = await opportunities.getOpportunities();

// Get a specific opportunity
const opp = await opportunities.getOpportunity('opp-123');

// Create a new opportunity
const newOpp = await opportunities.createOpportunity({
  name: 'tech-startup',
  display_name: 'Tech Startup',
  description: 'AI-powered SaaS platform',
  category: 'Technology',
  tags: ['AI', 'SaaS', 'B2B'],
});

// Update an opportunity
const updated = await opportunities.updateOpportunity('opp-123', {
  description: 'Updated description',
  tags: ['AI', 'ML', 'Cloud'],
});

// Delete an opportunity (soft delete)
await opportunities.deleteOpportunity('opp-123');

// Permanently delete
await opportunities.deleteOpportunity('opp-123', true);
```

### Documents

```typescript
// Get all documents for an opportunity
const docs = await documents.getDocuments('opp-123');

// Upload documents with tags
const files = [file1, file2, file3];
const uploadedDocs = await documents.uploadDocuments('opp-123', files, {
  0: ['financial', 'Q4'],  // Tags for first file
  1: ['report', 'annual'], // Tags for second file
  2: ['presentation'],     // Tags for third file
});

// Get a specific document
const doc = await documents.getDocument('opp-123', 'doc-456');

// Update document metadata
const updatedDoc = await documents.updateDocument('opp-123', 'doc-456', {
  name: 'Financial Report Q4 2024',
  tags: ['financial', 'quarterly', '2024'],
});

// Get download URL
const { download_url, expires_in_hours } = await documents.getDocumentDownloadUrl(
  'opp-123',
  'doc-456',
  24 // expires in 24 hours
);

// Delete a document
await documents.deleteDocument('opp-123', 'doc-456');
```

### Document Processing

```typescript
// Start processing (non-streaming)
const job = await documents.startDocumentProcessing('opp-123', ['doc-1', 'doc-2']);
console.log(job.job_id, job.status);

// Stream processing progress with SSE
const eventSource = documents.streamDocumentProcessing(
  'opp-123',
  ['doc-1', 'doc-2', 'doc-3'],
  (event) => {
    console.log('Event:', event.type, event.data);
    
    switch (event.type) {
      case 'processing_started':
        console.log('Processing started');
        break;
      case 'document_started':
        console.log('Processing document:', event.data.document_id);
        break;
      case 'stage_progress':
        console.log('Progress:', event.data.progress, '%');
        break;
      case 'document_completed':
        console.log('Document done:', event.data.document_id);
        break;
      case 'processing_completed':
        console.log('All documents processed!');
        break;
      case 'error':
        console.error('Error:', event.data.error);
        break;
    }
  },
  (error) => {
    console.error('SSE error:', error);
  },
  () => {
    console.log('Processing complete!');
  }
);

// Close the stream when needed
// eventSource.close();

// Get processing status for a specific document
const status = await documents.getDocumentProcessingStatus('opp-123', 'doc-456');
console.log(status.status, status.progress);

// Get processing statistics for all documents
const stats = await documents.getProcessingStatistics('opp-123');
console.log(`Total: ${stats.total_documents}, Completed: ${stats.completed}`);
```

### Analysis

```typescript
// Get all analyses
const analyses = await analysis.getAnalyses();

// Get analyses for a specific opportunity
const oppAnalyses = await analysis.getAnalysesByOpportunity('opp-123');

// Get a specific analysis
const analysisDetail = await analysis.getAnalysis('analysis-789');

// Create a new analysis
const newAnalysis = await analysis.createAnalysis({
  name: 'Q4 2024 Analysis',
  opportunity_id: 'opp-123',
  investment_hypothesis: 'Strong growth potential in AI sector',
  tags: ['Q4', '2024'],
});

// Start an analysis
const started = await analysis.startAnalysis('analysis-789');

// Update an analysis
const updated = await analysis.updateAnalysis('analysis-789', {
  overall_score: 85,
  agent_results: {
    financial: { score: 90, summary: 'Strong financials' },
    market: { score: 80, summary: 'Growing market' },
  },
});

// Complete an analysis
const completed = await analysis.completeAnalysis('analysis-789', {
  overall_score: 85,
  result: 'Recommended for investment',
  agent_results: {
    financial: { score: 90 },
    market: { score: 80 },
    technical: { score: 85 },
  },
});

// Mark as failed
const failed = await analysis.failAnalysis('analysis-789', {
  error_message: 'Insufficient data',
});

// Delete an analysis (soft delete)
await analysis.deleteAnalysis('analysis-789');

// Permanently delete
await analysis.deleteAnalysis('analysis-789', false);
```

## Error Handling

All API methods throw an `APIException` on error with the following properties:

```typescript
try {
  const opp = await opportunities.getOpportunity('invalid-id');
} catch (error) {
  if (error instanceof APIException) {
    console.error('Status:', error.status);      // HTTP status code
    console.error('Message:', error.message);    // Error message
    console.error('Detail:', error.detail);      // Additional error details
  }
}
```

## Types

All TypeScript types are exported from `types.ts`:

```typescript
import type {
  Opportunity,
  Document,
  Analysis,
  ProcessingEvent,
  // ... and many more
} from '@/lib/api/types';
```

## Advanced Usage

### Custom API Client Configuration

```typescript
import { apiClient } from '@/lib/api';

// Update configuration
apiClient.setConfig({
  baseURL: 'https://api.example.com',
  timeout: 60000,
  headers: {
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value',
  },
});
```

### Using the Low-Level Client

```typescript
import { apiClient } from '@/lib/api';

// Direct HTTP methods
const data = await apiClient.get('/custom/endpoint', { param: 'value' });
const result = await apiClient.post('/custom/endpoint', { data: 'value' });
const updated = await apiClient.put('/custom/endpoint/123', { data: 'new' });
await apiClient.delete('/custom/endpoint/123');
```

## Server-Sent Events (SSE)

The document processing stream uses Server-Sent Events for real-time updates:

```typescript
const eventSource = documents.streamDocumentProcessing(
  opportunityId,
  documentIds,
  handleEvent,
  handleError,
  handleComplete
);

// Remember to close the connection when done
eventSource.close();
```

Event types:
- `processing_started` - Processing has begun
- `document_started` - Started processing a document
- `stage_started` - Started a processing stage
- `stage_progress` - Progress update for current stage
- `stage_completed` - Completed a processing stage
- `document_completed` - Completed processing a document
- `processing_completed` - All documents processed
- `error` - An error occurred
