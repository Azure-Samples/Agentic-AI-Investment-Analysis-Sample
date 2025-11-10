/**
 * Type definitions for the Investment Analysis API
 */

import { EventMessage } from "./analysisEvents";

// Base types
export type ProcessingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type AnalysisStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Opportunity types
export interface Opportunity {
  id: string;
  name: string;
  display_name: string;
  description: string;
  owner_id: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpportunityCreateRequest {
  name: string;
  display_name: string;
  description: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

export interface OpportunityUpdateRequest {
  display_name?: string;
  description?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

// Document types
export interface Document {
  id: string;
  name: string;
  tags: string[];
  opportunity_id: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  processing_status: ProcessingStatus;
  processing_progress: number;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
}

export interface DocumentUpdateRequest {
  name?: string;
  tags?: string[];
}

export interface ProcessDocumentsRequest {
  document_ids: string[];
}

export interface ProcessingJobResponse {
  job_id: string;
  document_count: number;
  document_ids: string[];
  status: string;
  started_at: string;
}

export interface DocumentDownloadResponse {
  download_url: string;
  expires_in_hours: number;
}

export interface ProcessingStatusResponse {
  document_id: string;
  status: ProcessingStatus;
  progress: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface ProcessingStatistics {
  total_documents: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
}

// Analysis types
export interface Analysis {
  id: string;
  name: string;
  tags: string[];
  opportunity_id: string;
  investment_hypothesis?: string;
  status: AnalysisStatus;
  agent_results: Record<string, any>;
  result?: string;
  started_at?: string;
  completed_at?: string;
  owner_id: string;
  error_details?: Record<string, any>;
  is_active: boolean;
  events: EventMessage[];
  created_at: string;
  updated_at: string;
}

export interface AnalysisCreateRequest {
  name: string;
  opportunity_id: string;
  investment_hypothesis?: string;
  tags?: string[];
}

// Processing event types (for SSE)
export type ProcessingEventType =
  | 'processing_started'
  | 'document_started'
  | 'stage_started'
  | 'stage_progress'
  | 'stage_completed'
  | 'document_completed'
  | 'processing_completed'
  | 'error';

export interface ProcessingEvent {
  type: ProcessingEventType;
  data: any;
  timestamp?: string;
}

// API Response wrapper (for error handling)
export interface APIError {
  detail: string | { message: string; errors?: any[] };
  status?: number;
}

export class APIException extends Error {
  public status: number;
  public detail: any;

  constructor(message: string, status: number = 500, detail?: any) {
    super(message);
    this.name = 'APIException';
    this.status = status;
    this.detail = detail;
  }
}
