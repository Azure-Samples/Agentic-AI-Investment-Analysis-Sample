/**
 * API client for Document endpoints
 */

import apiClient from './client';
import type {
  Document,
  DocumentUpdateRequest,
  ProcessDocumentsRequest,
  ProcessingJobResponse,
  DocumentDownloadResponse,
  ProcessingStatusResponse,
  ProcessingStatistics,
  ProcessingEvent,
} from './types';

/**
 * Get all documents for an opportunity
 */
export async function getDocuments(opportunityId: string): Promise<Document[]> {
  return apiClient.get<Document[]>(`/opportunity/opportunities/${opportunityId}/documents`);
}

/**
 * Get a specific document
 */
export async function getDocument(opportunityId: string, documentId: string): Promise<Document> {
  return apiClient.get<Document>(
    `/opportunity/opportunities/${opportunityId}/documents/${documentId}`
  );
}

/**
 * Upload documents to an opportunity
 * @param opportunityId - The ID of the opportunity
 * @param files - Array of files to upload
 * @param fileTags - Optional object mapping file index to array of tags (e.g., { 0: ['tag1', 'tag2'], 1: ['tag3'] })
 */
export async function uploadDocuments(
  opportunityId: string,
  files: File[],
  fileTags?: Record<number, string[]>
): Promise<Document[]> {
  const metadata: Record<string, string> = {};

  // Add tags for each file if provided
  if (fileTags) {
    Object.entries(fileTags).forEach(([index, tags]) => {
      metadata[`tags_${index}`] = tags.join(',');
    });
  }

  return apiClient.uploadFiles<Document[]>(
    `/opportunity/opportunities/${opportunityId}/documents/upload`,
    files,
    metadata
  );
}

/**
 * Update a document's metadata
 */
export async function updateDocument(
  opportunityId: string,
  documentId: string,
  data: DocumentUpdateRequest
): Promise<Document> {
  return apiClient.put<Document>(
    `/opportunity/opportunities/${opportunityId}/documents/${documentId}`,
    data
  );
}

/**
 * Delete a document
 */
export async function deleteDocument(opportunityId: string, documentId: string): Promise<void> {
  return apiClient.delete<void>(
    `/opportunity/opportunities/${opportunityId}/documents/${documentId}`
  );
}

/**
 * Get a download URL for a document
 * @param opportunityId - The ID of the opportunity
 * @param documentId - The ID of the document
 * @param expiryHours - Hours until the download link expires (1-24, default: 1)
 */
export async function getDocumentDownloadUrl(
  opportunityId: string,
  documentId: string,
  expiryHours: number = 1
): Promise<DocumentDownloadResponse> {
  return apiClient.get<DocumentDownloadResponse>(
    `/opportunity/opportunities/${opportunityId}/documents/${documentId}/download`,
    { expiry_hours: expiryHours }
  );
}

/**
 * Start processing documents (non-streaming)
 * Returns immediately with a job ID. Use getDocumentProcessingStatus to check progress.
 */
export async function startDocumentProcessing(
  opportunityId: string,
  documentIds: string[]
): Promise<ProcessingJobResponse> {
  return apiClient.post<ProcessingJobResponse>(
    `/opportunity/opportunities/${opportunityId}/documents/process`,
    { document_ids: documentIds } as ProcessDocumentsRequest
  );
}

/**
 * Process documents with streaming progress updates via Server-Sent Events
 * @param opportunityId - The ID of the opportunity
 * @param documentIds - Array of document IDs to process
 * @param onEvent - Callback function to handle processing events
 * @param onError - Callback function to handle errors
 * @param onComplete - Callback function called when processing completes
 * @returns EventSource instance (caller should close it when done)
 */
export function streamDocumentProcessing(
  opportunityId: string,
  documentIds: string[],
  onEvent: (event: ProcessingEvent) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): EventSource {
  const eventSource = apiClient.createEventSource(
    `/opportunity/opportunities/${opportunityId}/documents/process/stream`,
    { document_ids: documentIds.join(',') }
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);

      // Check if processing is complete
      if (data.type === 'processing_completed' && onComplete) {
        onComplete();
        eventSource.close();
      }
    } catch (error) {
      console.error('Error parsing SSE event:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    if (onError) {
      onError(new Error('SSE connection error'));
    }
    eventSource.close();
  };

  return eventSource;
}

/**
 * Get the processing status of a specific document
 */
export async function getDocumentProcessingStatus(
  opportunityId: string,
  documentId: string
): Promise<ProcessingStatusResponse> {
  return apiClient.get<ProcessingStatusResponse>(
    `/opportunity/opportunities/${opportunityId}/documents/${documentId}/processing-status`
  );
}

/**
 * Get processing statistics for all documents in an opportunity
 */
export async function getProcessingStatistics(
  opportunityId: string
): Promise<ProcessingStatistics> {
  return apiClient.get<ProcessingStatistics>(
    `/opportunity/opportunities/${opportunityId}/processing-statistics`
  );
}
