import { useState, useCallback, useRef, useEffect } from "react";
import type { Message, TextMessage, MarkdownTextMessage, EventStatusMessage, ReasoningMessage } from "./types";
import type { ChatConversation } from "./chatHistoryTypes";

export interface ChatApiConfig {
  apiBaseUrl: string;
  enableSSE?: boolean;
  timeout?: number;
}

export interface ChatMessageRequest {
  message: string;
  conversationId: string | null;
  messageHistory: Message[];
  userId?: string;
  context?: Record<string, any>;
}

export interface StreamEventMessage {
  type: "message" | "markdown" | "reasoning" | "error" | "complete" | "workflow_status" | "workflow_completed";
  executor?: string;
  message?: string;
  data?: any;
  sequence?: number;
  correlation_id?: string;
  timestamp?: string;
  error?: string;
  additional_context?: Record<string, any>;
}

export interface UseChatApiReturn {
  sendMessage: (content: string, context: any) => Promise<string | null>;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  abortStream: () => void;
  currentStreamContent: string;
  onConversationIdReceived?: (conversationId: string) => void;
}

export const useChatApi = (
  config: ChatApiConfig,
  currentConversationId: string | null,
  messages: Message[],
  onMessageReceived: (message: Message) => void,
  onError?: (error: string) => void,
  onConversationIdReceived?: (conversationId: string) => void
): UseChatApiReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamContent, setCurrentStreamContent] = useState("");
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortStream();
    };
  }, []);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsStreaming(false);
    setIsLoading(false);
    if (onError) {
      onError(errorMessage);
    }
    
    // Create error message
    const errorMsg: Message = {
      role: "assistant",
      type: "error",
      errorType: "system",
      title: "Communication Error",
      message: errorMessage,
      errorCode: "API_ERR_001",
      recoverable: true,
      timestamp: new Date()
    };
    onMessageReceived(errorMsg);
  }, [onError, onMessageReceived]);

  const sendMessageWithSSE = useCallback(async (content: string, context: any): Promise<string | null> => {
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentStreamContent("");
    setError(null);

    try {
      // First, send the message via POST to initiate the stream
      // Send null if conversation ID is temporary (starts with 'temp-')
      const conversationIdToSend = currentConversationId?.startsWith('temp-') ? null : currentConversationId;
      
      const requestBody: ChatMessageRequest = {
        message: content,
        conversationId: conversationIdToSend,
        messageHistory: messages,
        context: context
      };

      const response = await fetch(`${config.apiBaseUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const streamId = data.streamId;
      const returnedConversationId = data.conversationId;

      setIsLoading(false);

      // Immediately notify about the conversation ID so the UI can update
      if (returnedConversationId && onConversationIdReceived) {
        onConversationIdReceived(returnedConversationId);
      }

      // Connect to SSE endpoint
      const eventSource = new EventSource(
        `${config.apiBaseUrl}/chat/stream/${streamId}`
      );
      eventSourceRef.current = eventSource;

      let accumulatedContent = "";

      eventSource.onmessage = (event) => {
        try {
          const streamEventMessage: StreamEventMessage = JSON.parse(event.data);

          switch (streamEventMessage.type) {
            case "workflow_status":
              const eventMessage: EventStatusMessage = {
                  type: "event",
                  role: "assistant",
                  eventName: streamEventMessage?.message,
                  status: streamEventMessage?.data?.status || "in_progress",
                  description: streamEventMessage?.data?.description,
                  details: streamEventMessage?.data?.details,
                  assistant_id: streamEventMessage.executor,
                  timestamp: streamEventMessage.timestamp ? new Date(streamEventMessage.timestamp) : new Date()
                };
                // onMessageReceived(eventMessage);
              break;
            
            case "message":
              if (streamEventMessage.message) {
                accumulatedContent += streamEventMessage.message;
                setCurrentStreamContent(accumulatedContent);
              }
              break;

            case "markdown":
              if (streamEventMessage.executor) {
                const markdownMessage: MarkdownTextMessage = {
                  type: "markdown_text",
                  role: "assistant",
                  title: "",
                  content: streamEventMessage?.data,
                  assistant_id: streamEventMessage.executor,
                  timestamp: streamEventMessage.timestamp ? new Date(streamEventMessage.timestamp) : new Date()
                };
                onMessageReceived(markdownMessage);
              }
              break;

            case "reasoning":
              // Handle thinking/reasoning updates
              if (streamEventMessage.executor && streamEventMessage.data) {
                const reasoningMessage: ReasoningMessage = {
                  type: "reasoning",
                  role: "assistant",
                  assistant_id: streamEventMessage.executor,
                  timestamp: streamEventMessage.timestamp ? new Date(streamEventMessage.timestamp) : new Date(),
                  title: streamEventMessage.data?.name,
                  description: streamEventMessage.data?.description,
                  steps: Array.isArray(streamEventMessage.data?.steps) 
                    ? streamEventMessage.data.steps.map((step: any) => ({
                        step: step.number || 0,
                        description: step.task || "",
                        owner: step.assigned_agent || "",
                      }))
                    : [],
                  message: streamEventMessage.data?.message || ""
                };
                onMessageReceived(reasoningMessage);
              }
              break;

            // case "complete":
            //   // Stream completed, create final message
            //   if (streamEventMessage.message) {
            //     onMessageReceived(streamEventMessage.message);
            //   } else if (accumulatedContent) {
            //     const finalMessage: TextMessage = {
            //       role: "assistant",
            //       type: "text",
            //       content: accumulatedContent,
            //       timestamp: new Date()
            //     };
            //     onMessageReceived(finalMessage);
            //   }
            //   break;

            case "error":
              if (streamEventMessage.message || streamEventMessage.data) {
                const errorMsg = streamEventMessage.message || (streamEventMessage.data?.error) || "An unknown error occurred during streaming.";
                handleError(errorMsg);
              }

              setCurrentStreamContent("");
              eventSource.close();
              setIsStreaming(false);
              break;
            
            case "workflow_completed":
              setCurrentStreamContent("");
              eventSource.close();
              setIsStreaming(false);
              break;

            default:
              console.warn("Unknown stream event type:", streamEventMessage.type);
          }
          
          
          
        } catch (parseError) {
          console.error("Error parsing SSE data:", parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error("SSE error:", event);
        eventSource.close();
        
        if (accumulatedContent) {
          // Save partial content if available
          const partialMessage: TextMessage = {
            role: "assistant",
            type: "text",
            content: accumulatedContent,
            timestamp: new Date()
          };
          onMessageReceived(partialMessage);
        }
        
        handleError("Connection to server lost. Please try again.");
      };

      // Return the thread ID
      return returnedConversationId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      handleError(errorMessage);
      return null;
    }
  }, [config.apiBaseUrl, currentConversationId, messages, onMessageReceived, handleError, onConversationIdReceived]);

  const sendMessageWithPolling = useCallback(async (content: string, context: any): Promise<string | null> => {
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentStreamContent("");
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Send null if conversation ID is temporary (starts with 'temp-')
      const conversationIdToSend = currentConversationId?.startsWith('temp-') ? null : currentConversationId;
      
      const requestBody: ChatMessageRequest = {
        message: content,
        conversationId: conversationIdToSend,
        messageHistory: messages,
        context: context
      };

      const response = await fetch(`${config.apiBaseUrl}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const returnedConversationId = data.conversationId;

      setIsLoading(false);
      setIsStreaming(false);

      // Immediately notify about the conversation ID so the UI can update
      if (returnedConversationId && onConversationIdReceived) {
        onConversationIdReceived(returnedConversationId);
      }

      // Handle different response types
      if (data.messages && Array.isArray(data.messages)) {
        // Multiple messages returned
        data.messages.forEach((msg: Message) => {
          onMessageReceived(msg);
        });
      } else if (data.message) {
        // Single message returned
        onMessageReceived(data.message);
      } else if (data.content) {
        // Plain text response
        const message: TextMessage = {
          role: "assistant",
          type: "text",
          content: data.content,
          timestamp: new Date()
        };
        onMessageReceived(message);
      }

      // Return the thread ID
      return returnedConversationId;

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted
        return null;
      }
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      handleError(errorMessage);
      return null;
    } finally {
      abortControllerRef.current = null;
    }
  }, [config.apiBaseUrl, currentConversationId, messages, onMessageReceived, handleError, onConversationIdReceived]);

  const sendMessage = useCallback(async (content: string, context:any): Promise<string | null> => {
    if (config.enableSSE !== false) {
      return await sendMessageWithSSE(content, context);
    } else {
      return await sendMessageWithPolling(content, context);
    }
  }, [config.enableSSE, sendMessageWithSSE, sendMessageWithPolling]);

  return {
    sendMessage,
    isStreaming,
    isLoading,
    error,
    abortStream,
    currentStreamContent,
  };
};
