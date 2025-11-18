/**
 * API client for Analysis endpoints
 */

import apiClient from './client';
import type {
  Analysis,
  AnalysisCreateRequest,
} from './types';
import type { EventMessage } from './analysisEvents';

/**
 * Get all analyses for the current user
 */
export async function getAnalyses(isActive: boolean = true): Promise<Analysis[]> {
  return apiClient.get<Analysis[]>('/analysis/', { is_active: isActive });
}

/**
 * Get all analyses for a specific opportunity
 */
export async function getAnalysesByOpportunity(opportunityId: string): Promise<Analysis[]> {
  return apiClient.get<Analysis[]>(`/analysis/opportunity/${opportunityId}`);
}

/**
 * Get a specific analysis by ID
 */
export async function getAnalysis(opportunityId: string, analysisId: string): Promise<Analysis> {
  return apiClient.get<Analysis>(`/analysis/${opportunityId}/${analysisId}`);
}

/**
 * Create a new analysis
 */
export async function createAnalysis(data: AnalysisCreateRequest): Promise<Analysis> {
  return apiClient.post<Analysis>('/analysis/', data);
}

/**
 * Start an analysis run
 */
export async function startAnalysis(clientId:string, opportunityId: string, analysisId: string): Promise<Analysis> {
  return apiClient.post<Analysis>(`/analysis/${opportunityId}/${analysisId}/start/${clientId}`, {});
}

/**
 * Delete an analysis
 * @param opportunityId - The ID of the opportunity
 * @param analysisId - The ID of the analysis to delete
 * @param softDelete - If true, use soft delete (mark as inactive). If false, permanently delete
 */
export async function deleteAnalysis(
  opportunityId: string,
  analysisId: string,
  softDelete: boolean = true
): Promise<void> {
  return apiClient.delete<void>(`/analysis/${opportunityId}/${analysisId}`, { soft_delete: softDelete });
}

/**
 * Fetch all events for a specific analysis
 * @param opportunityId - The ID of the opportunity
 * @param analysisId - The ID of the analysis
 * @returns Promise resolving to an array of EventMessage objects
 */
export async function fetchAnalysisEvents(
  opportunityId: string,
  analysisId: string
): Promise<EventMessage[]> {
  return apiClient.get<EventMessage[]>(`/analysis/${opportunityId}/${analysisId}/events`);
}
