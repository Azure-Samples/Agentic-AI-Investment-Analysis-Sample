/**
 * Base API client configuration and utilities
 */

import { APIException } from './types';

export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

class APIClient {
  private config: APIClientConfig;

  constructor(config: APIClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Get the base URL for API requests
   */
  getBaseURL(): string {
    return this.config.baseURL;
  }

  /**
   * Set or update configuration
   */
  setConfig(config: Partial<APIClientConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get default headers for requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorDetail: any;
      try {
        errorDetail = await response.json();
      } catch {
        errorDetail = { detail: response.statusText };
      }

      const message =
        typeof errorDetail.detail === 'string'
          ? errorDetail.detail
          : errorDetail.detail?.message || 'An error occurred';

      throw new APIException(message, response.status, errorDetail.detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.config.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any, customHeaders?: HeadersInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers = customHeaders || this.getHeaders();
      const body = headers['Content-Type'] === 'application/json' 
        ? JSON.stringify(data)
        : data;

      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.config.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Upload files with multipart/form-data
   */
  async uploadFiles<T>(endpoint: string, files: File[], metadata?: Record<string, any>): Promise<T> {
    const formData = new FormData();

    // Add files
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Add metadata (e.g., tags for each file)
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout! * 3); // Longer timeout for uploads

    try {
      const headers = { ...this.config.headers };
      // Don't set Content-Type for FormData - browser will set it with boundary

      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Create an EventSource for Server-Sent Events
   */
  createEventSource(endpoint: string, params?: Record<string, any>): EventSource {
    const url = new URL(`${this.config.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return new EventSource(url.toString());
  }
}

// Create and export a default API client instance
// The base URL can be configured from environment variables
const apiClient = new APIClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8084/api',
});

export default apiClient;
export { APIClient };
