// lib/api/analysisEvents.ts
/**
 * Analysis Event Client using Server-Sent Events (SSE)
 * Connects to the analysis event stream and handles reconnections
 */

export interface EventMessage {
  type: string;
  executor?: string;
  data: any;
  sequence: number;
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
    onEvent: (event: EventMessage) => void,
    onStateChange: (state: ConnectionState) => void
  ): void {
    this.disconnect(); // Clean up any existing connection
    
    // Build URL with optional since_sequence parameter for reconnection
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8084/api';
    const eventUrl = `/analysis/${this.opportunityId}/${this.analysisId}/stream`;
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
        const eventMessage: EventMessage = JSON.parse(event.data);
        
        // Track sequence number for reconnection
        if (eventMessage?.sequence !== undefined) {
          this.lastSequence = eventMessage.sequence;
        }
        
        onEvent(eventMessage);
        
        // Auto-disconnect when workflow completes or fails
        if (eventMessage.type === 'workflow_completed' || eventMessage.type === 'workflow_failed') {
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
      
      const eventSource = this.eventSource;
      this.eventSource?.close();
      
      // Check the readyState to determine if we should retry
      // CONNECTING (0) or CLOSED (2) - network issue, can retry
      // But if we got a response (even an error response), EventSource will be in CLOSED state
      // We need to check if this is a network error or a server error
      const shouldRetry = eventSource?.readyState === EventSource.CONNECTING || 
                          (eventSource?.readyState === EventSource.CLOSED && 
                           eventSource.url === this.eventSource?.url);
      
      // Only retry on network errors, not on HTTP errors (400, 404, 500, etc.)
      // EventSource doesn't expose HTTP status, but server errors typically close immediately
      // Network errors keep the connection in CONNECTING state
      const isNetworkError = !error || (error as any).target?.readyState === EventSource.CONNECTING;
      
      if (isNetworkError && this.reconnectAttempts < this.maxReconnectAttempts) {
        onStateChange('error');
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        console.log(`Network error detected. Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.connect(onEvent, onStateChange);
        }, delay);
      } else {
        // HTTP error or max retries reached - don't reconnect
        if (!isNetworkError) {
          console.error('Server error detected (likely HTTP 4xx/5xx). Not retrying.');
        } else {
          console.error('Max reconnection attempts reached');
        }
        onStateChange('error');
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

export function useAnalysisEvents(opportunityId: string, analysisId: string, isCompleted?: boolean) {
  const [events, setEvents] = useState<EventMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastSequence, setLastSequence] = useState<number>(-1);
  const clientRef = useRef<AnalysisEventClient | null>(null);

  useEffect(() => {
    if (!opportunityId || !analysisId || isCompleted) {
      // Cleanup and reset when completed or missing IDs
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      return;
    }

    // Reset state when analysisId changes (new analysis run)
    setEvents([]);
    setConnectionState('disconnected');
    setLastSequence(-1);

    // Event handlers defined inside effect to ensure they're fresh for each analysis
    const handleEvent = (event: EventMessage) => {
      setEvents(prev => [...prev, event]);
      if (event?.sequence !== undefined) {
        setLastSequence(event.sequence);
      }
    };

    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state);
    };

    // Create client and connect
    const client = new AnalysisEventClient(opportunityId, analysisId);
    clientRef.current = client;
    
    client.connect(handleEvent, handleStateChange);

    // Cleanup on unmount or when analysisId changes
    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [opportunityId, analysisId, isCompleted]);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      const handleEvent = (event: EventMessage) => {
        setEvents(prev => [...prev, event]);
        if (event?.sequence !== undefined) {
          setLastSequence(event.sequence);
        }
      };

      const handleStateChange = (state: ConnectionState) => {
        setConnectionState(state);
      };

      clientRef.current.connect(handleEvent, handleStateChange);
    }
  }, []);

  return {
    events,
    connectionState,
    lastSequence,
    reconnect
  };
}
