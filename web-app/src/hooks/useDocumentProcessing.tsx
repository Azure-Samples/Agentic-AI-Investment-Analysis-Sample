/**
 * Example React Hook for Document Processing with SSE
 * 
 * This hook demonstrates how to integrate with the document processing API
 * and handle Server-Sent Events for real-time progress updates.
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ProcessingEvent {
  type: 'processing_started' | 'document_started' | 'stage_started' | 
        'stage_progress' | 'stage_completed' | 'document_completed' | 
        'processing_completed' | 'error';
  document_id?: string;
  document_name?: string;
  document_index?: number;
  total_documents?: number;
  document_count?: number;
  stage_id?: string;
  stage_name?: string;
  stage_description?: string;
  stage_index?: number;
  total_stages?: number;
  stage_progress?: number;
  overall_progress?: number;
  message?: string;
  timestamp: string;
}

export interface DocumentProgress {
  documentId: string;
  documentName: string;
  progress: number;
  currentStage?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UseDocumentProcessingOptions {
  opportunityId: string;
  documentIds: string[];
  onComplete?: () => void;
  onError?: (error: string) => void;
  apiBaseUrl?: string;
}

export function useDocumentProcessing({
  opportunityId,
  documentIds,
  onComplete,
  onError,
  apiBaseUrl = '/api/opportunity'
}: UseDocumentProcessingOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<ProcessingEvent[]>([]);
  const [documentProgress, setDocumentProgress] = useState<Map<string, DocumentProgress>>(new Map());
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize document progress tracking
  useEffect(() => {
    const initialProgress = new Map<string, DocumentProgress>();
    documentIds.forEach(docId => {
      initialProgress.set(docId, {
        documentId: docId,
        documentName: '',
        progress: 0,
        status: 'pending'
      });
    });
    setDocumentProgress(initialProgress);
  }, [documentIds]);

  const startProcessing = useCallback(async () => {
    if (!documentIds.length) {
      const errorMsg = 'No documents selected for processing';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setEvents([]);

    // Construct SSE URL
    const url = `${apiBaseUrl}/opportunities/${opportunityId}/documents/process/stream?document_ids=${documentIds.join(',')}`;
    
    // Create EventSource connection
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: ProcessingEvent = JSON.parse(event.data);
        
        // Add to events log
        setEvents(prev => [...prev, data]);

        // Handle different event types
        switch (data.type) {
          case 'processing_started':
            console.log('Processing started for', data.document_count, 'documents');
            break;

          case 'document_started':
            setDocumentProgress(prev => {
              const newProgress = new Map(prev);
              if (data.document_id) {
                newProgress.set(data.document_id, {
                  documentId: data.document_id,
                  documentName: data.document_name || '',
                  progress: 0,
                  status: 'processing'
                });
              }
              return newProgress;
            });
            break;

          case 'stage_started':
            setDocumentProgress(prev => {
              const newProgress = new Map(prev);
              if (data.document_id) {
                const current = newProgress.get(data.document_id);
                if (current) {
                  newProgress.set(data.document_id, {
                    ...current,
                    currentStage: data.stage_name
                  });
                }
              }
              return newProgress;
            });
            break;

          case 'stage_progress':
            setDocumentProgress(prev => {
              const newProgress = new Map(prev);
              if (data.document_id && data.overall_progress !== undefined) {
                const current = newProgress.get(data.document_id);
                if (current) {
                  newProgress.set(data.document_id, {
                    ...current,
                    progress: data.overall_progress,
                    currentStage: data.stage_name
                  });
                }
              }
              return newProgress;
            });
            
            // Update overall progress
            if (data.overall_progress !== undefined && data.document_index !== undefined && data.total_documents) {
              const docWeight = 100 / data.total_documents;
              const completedDocs = data.document_index * docWeight;
              const currentDocProgress = (data.overall_progress / 100) * docWeight;
              setOverallProgress(Math.round(completedDocs + currentDocProgress));
            }
            break;

          case 'document_completed':
            setDocumentProgress(prev => {
              const newProgress = new Map(prev);
              if (data.document_id) {
                const current = newProgress.get(data.document_id);
                if (current) {
                  newProgress.set(data.document_id, {
                    ...current,
                    progress: 100,
                    status: 'completed'
                  });
                }
              }
              return newProgress;
            });
            break;

          case 'processing_completed':
            console.log('All processing completed!');
            setIsProcessing(false);
            setOverallProgress(100);
            eventSource.close();
            onComplete?.();
            break;

          case 'error':
            const errorMessage = data.message || 'Unknown error occurred';
            console.error('Processing error:', errorMessage);
            setError(errorMessage);
            
            if (data.document_id) {
              setDocumentProgress(prev => {
                const newProgress = new Map(prev);
                const current = newProgress.get(data.document_id);
                if (current) {
                  newProgress.set(data.document_id, {
                    ...current,
                    status: 'error',
                    error: errorMessage
                  });
                }
                return newProgress;
              });
            }
            
            onError?.(errorMessage);
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      const errorMsg = 'Connection to server lost';
      setError(errorMsg);
      setIsProcessing(false);
      eventSource.close();
      onError?.(errorMsg);
    };

  }, [opportunityId, documentIds, apiBaseUrl, onComplete, onError]);

  const stopProcessing = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsProcessing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, [stopProcessing]);

  return {
    isProcessing,
    events,
    documentProgress: Array.from(documentProgress.values()),
    overallProgress,
    error,
    startProcessing,
    stopProcessing
  };
}

/**
 * Example Usage Component
 */
export function DocumentProcessingExample() {
  const opportunityId = 'opp-1';
  const documentIds = ['doc-1', 'doc-2', 'doc-3'];

  const {
    isProcessing,
    documentProgress,
    overallProgress,
    error,
    startProcessing,
    stopProcessing
  } = useDocumentProcessing({
    opportunityId,
    documentIds,
    onComplete: () => {
      console.log('Processing completed successfully!');
      // Refresh document list, show success message, etc.
    },
    onError: (error) => {
      console.error('Processing failed:', error);
      // Show error toast, etc.
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={startProcessing}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Start Processing'}
        </button>
        
        {isProcessing && (
          <button
            onClick={stopProcessing}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Stop
          </button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Progress</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Individual Document Progress */}
      <div className="space-y-3">
        {documentProgress.map((doc) => (
          <div key={doc.documentId} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{doc.documentName || doc.documentId}</div>
                {doc.currentStage && (
                  <div className="text-sm text-gray-600">{doc.currentStage}</div>
                )}
              </div>
              <div className="text-sm">
                {doc.status === 'completed' && '✓ Completed'}
                {doc.status === 'processing' && `${doc.progress}%`}
                {doc.status === 'error' && '✗ Error'}
                {doc.status === 'pending' && 'Pending'}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  doc.status === 'completed' ? 'bg-green-500' :
                  doc.status === 'error' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${doc.progress}%` }}
              />
            </div>
            
            {doc.error && (
              <div className="text-sm text-red-600">{doc.error}</div>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
