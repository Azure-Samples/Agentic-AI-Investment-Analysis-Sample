/**
 * Main API client export
 * 
 * This module provides a complete TypeScript client for the Investment Analysis API.
 * 
 * @example
 * ```typescript
 * import { opportunities, documents, analysis } from '@/lib/api';
 * 
 * // Get all opportunities
 * const opps = await opportunities.getOpportunities();
 * 
 * // Upload documents
 * const docs = await documents.uploadDocuments(oppId, files, {
 *   0: ['financial', 'Q4'],
 *   1: ['report', 'annual']
 * });
 * 
 * // Stream document processing
 * const eventSource = documents.streamDocumentProcessing(
 *   oppId,
 *   docIds,
 *   (event) => console.log(event),
 *   (error) => console.error(error),
 *   () => console.log('Done!')
 * );
 * ```
 */

// Export API client
export { default as apiClient, APIClient } from './client';
export type { APIClientConfig } from './client';

// Export types
export * from './types';

// Export API modules
import * as opportunities from './opportunities';
import * as documents from './documents';
import * as analysis from './analysis';

export { opportunities, documents, analysis };

// Default export with all API modules
export default {
  opportunities,
  documents,
  analysis,
};
