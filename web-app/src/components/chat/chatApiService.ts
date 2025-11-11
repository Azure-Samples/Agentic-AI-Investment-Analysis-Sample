import type { Message } from "./types";
import type { ChatThread } from "./chatHistoryTypes";

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface CreateThreadRequest {
  title?: string;
  initialMessage?: string;
  context?: Record<string, any>;
}

export interface CreateThreadResponse {
  thread: ChatThread;
  threadId: string;
}

export interface GetThreadResponse {
  thread: ChatThread;
}

export interface ListThreadsResponse {
  threads: ChatThread[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeleteThreadResponse {
  success: boolean;
  message: string;
}

export interface SendFeedbackRequest {
  threadId: string;
  messageId: string;
  feedbackType: string;
  response: any;
}

export interface SendFeedbackResponse {
  success: boolean;
  message?: string;
}

/**
 * Chat API Service
 * Provides functions to interact with the chat backend API
 */
export class ChatApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    };
  }

  /**
   * Create a new chat thread
   */
  async createThread(request: CreateThreadRequest): Promise<CreateThreadResponse> {
    const response = await this.fetch("/chat/threads", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Get a specific thread by ID
   */
  async getThread(threadId: string): Promise<GetThreadResponse> {
    const response = await this.fetch(`/chat/threads/${threadId}`, {
      method: "GET",
    });

    return response.json();
  }

  /**
   * List all threads for the current user
   */
  async listThreads(page = 1, pageSize = 20): Promise<ListThreadsResponse> {
    const response = await this.fetch(
      `/chat/threads?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
      }
    );

    return response.json();
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string): Promise<DeleteThreadResponse> {
    const response = await this.fetch(`/chat/threads/${threadId}`, {
      method: "DELETE",
    });

    return response.json();
  }

  /**
   * Update thread metadata (title, tags, etc.)
   */
  async updateThread(
    threadId: string,
    updates: Partial<ChatThread>
  ): Promise<GetThreadResponse> {
    const response = await this.fetch(`/chat/threads/${threadId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    return response.json();
  }

  /**
   * Send feedback response (for human-in-the-loop)
   */
  async sendFeedback(request: SendFeedbackRequest): Promise<SendFeedbackResponse> {
    const response = await this.fetch("/chat/feedback", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Get message history for a thread
   */
  async getMessages(threadId: string): Promise<{ messages: Message[] }> {
    const response = await this.fetch(`/chat/threads/${threadId}/messages`, {
      method: "GET",
    });

    return response.json();
  }

  /**
   * Regenerate the last assistant message
   */
  async regenerateMessage(
    threadId: string,
    messageId: string
  ): Promise<{ message: Message }> {
    const response = await this.fetch(
      `/chat/threads/${threadId}/messages/${messageId}/regenerate`,
      {
        method: "POST",
      }
    );

    return response.json();
  }

  /**
   * Internal fetch wrapper with timeout and error handling
   */
  private async fetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request timeout");
        }
        throw error;
      }

      throw new Error("An unknown error occurred");
    }
  }
}

/**
 * Create a singleton instance of the API service
 */
let apiServiceInstance: ChatApiService | null = null;

export const initializeChatApi = (config: ApiConfig): ChatApiService => {
  apiServiceInstance = new ChatApiService(config);
  return apiServiceInstance;
};

export const getChatApi = (): ChatApiService => {
  if (!apiServiceInstance) {
    throw new Error(
      "ChatApiService not initialized. Call initializeChatApi first."
    );
  }
  return apiServiceInstance;
};
