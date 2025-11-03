/**
 * API client for Opportunity endpoints
 */

import apiClient from './client';
import type {
  Opportunity,
  OpportunityCreateRequest,
  OpportunityUpdateRequest,
} from './types';

/**
 * Get all opportunities
 */
export async function getOpportunities(isActive: boolean = true): Promise<Opportunity[]> {
  return apiClient.get<Opportunity[]>('/opportunity/opportunities', { is_active: isActive });
}

/**
 * Get a single opportunity by ID
 */
export async function getOpportunity(opportunityId: string): Promise<Opportunity> {
  return apiClient.get<Opportunity>(`/opportunity/opportunities/${opportunityId}`);
}

/**
 * Create a new opportunity
 */
export async function createOpportunity(data: OpportunityCreateRequest): Promise<Opportunity> {
  return apiClient.post<Opportunity>('/opportunity/opportunities', data);
}

/**
 * Update an existing opportunity
 */
export async function updateOpportunity(
  opportunityId: string,
  data: OpportunityUpdateRequest
): Promise<Opportunity> {
  return apiClient.put<Opportunity>(`/opportunity/opportunities/${opportunityId}`, data);
}

/**
 * Delete an opportunity
 * @param opportunityId - The ID of the opportunity to delete
 * @param permanent - If true, permanently delete. If false, soft delete (default)
 */
export async function deleteOpportunity(
  opportunityId: string,
  permanent: boolean = false
): Promise<void> {
  return apiClient.delete<void>(`/opportunity/opportunities/${opportunityId}`, {
    permanent,
  });
}
