/**
 * Example client for consuming the Analysis SSE events endpoint
 * 
 * Usage in React component:
 * 
 * ```typescript
 * import { useAnalysisEvents } from './useAnalysisEvents';
 * 
 * function AnalysisPage() {
 *   const { events, connectionState, lastSequence } = useAnalysisEvents(
 *     opportunityId,
 *     analysisId
 *   );
 *   
 *   return (
 *     <div>
 *       <p>Status: {connectionState}</p>
 *       {events.map(event => (
 *         <div key={event.data.sequence}>
 *           {event.event_type}: {event.message}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

export interface AnalysisEvent {
  event_type: string;
  agent?: string;
  data: {
    sequence: number;
    [key: string]: any;
  };
  message?: string;
  timestamp: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export class AnalysisEventClient {
  private eventSource: EventSource | null = null;
  private opportunityId: string;
  private analysisId: string;
  private lastSequence: number = -1;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  
  constructor(opportunityId: string, analysisId: string) {
    this.opportunityId = opportunityId;
    this.analysisId = analysisId;
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(
    onEvent: (event: AnalysisEvent) => void,
    onStateChange: (state: ConnectionState) => void
  ): void {
    this.disconnect(); // Clean up any existing connection
    
    // Build URL with optional since_sequence parameter for reconnection
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8084/api';
    const eventUrl = `/analysis/${this.opportunityId}/${this.analysisId}/events`;
    const url = this.lastSequence >= 0 
      ? `${baseURL}${eventUrl}?since_sequence=${this.lastSequence}`
      : `${baseURL}${eventUrl}`;
    
    onStateChange('connecting');
    
    this.eventSource = new EventSource(url, {
      withCredentials: false
    });

    this.eventSource.onopen = () => {
      console.log(`Connected to analysis ${this.analysisId} event stream`);
      this.reconnectAttempts = 0;
      onStateChange('connected');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data: AnalysisEvent = JSON.parse(event.data);
        
        // Track sequence number for reconnection
        if (data.data?.sequence !== undefined) {
          this.lastSequence = data.data.sequence;
        }
        
        onEvent(data);
        
        // Auto-disconnect when workflow completes or fails
        if (data.event_type === 'workflow_completed' || data.event_type === 'workflow_failed') {
          console.log('Workflow finished, closing connection');
          this.disconnect();
          onStateChange('disconnected');
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.eventSource?.close();
      onStateChange('error');
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.connect(onEvent, onStateChange);
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Get the last processed sequence number
   */
  getLastSequence(): number {
    return this.lastSequence;
  }
}

/**
 * React hook for consuming analysis events
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useAnalysisEvents(opportunityId: string, analysisId: string) {
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastSequence, setLastSequence] = useState<number>(-1);
  const clientRef = useRef<AnalysisEventClient | null>(null);

  // Use refs to avoid recreating callbacks
  const handleEventRef = useRef((event: AnalysisEvent) => {
    setEvents(prev => [...prev, event]);
    if (event.data?.sequence !== undefined) {
      setLastSequence(event.data.sequence);
    }
  });

  const handleStateChangeRef = useRef((state: ConnectionState) => {
    setConnectionState(state);
  });

  // Stable callback wrappers
  const handleEvent = useCallback((event: AnalysisEvent) => {
    handleEventRef.current(event);
  }, []);
 
  const handleStateChange = useCallback((state: ConnectionState) => {
    handleStateChangeRef.current(state);
  }, []);

  useEffect(() => {
    if (!opportunityId || !analysisId) return;

    // Reset state when analysisId changes (new analysis run)
    setEvents([]);
    setConnectionState('disconnected');
    setLastSequence(-1);

    // Create client and connect
    const client = new AnalysisEventClient(opportunityId, analysisId);
    clientRef.current = client;
    
    client.connect(handleEvent, handleStateChange);

    // Cleanup on unmount or when analysisId changes
    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [opportunityId, analysisId, handleEvent, handleStateChange]);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.connect(handleEvent, handleStateChange);
    }
  }, [handleEvent, handleStateChange]);

  return {
    events,
    connectionState,
    lastSequence,
    reconnect
  };
}
