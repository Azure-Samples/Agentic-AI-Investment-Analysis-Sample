import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, RefreshCw, StopCircle, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatHistoryPanel from "./ChatHistoryPanel";
import { useChatApi } from "./useChatApi";
import type { Message, TextMessage } from "./types";
import type { ChatThread } from "./chatHistoryTypes";

export interface ChatContainerProps {
  /**
   * API configuration (required)
   */
  apiConfig: {
    apiBaseUrl: string;
    enableSSE?: boolean;
    timeout?: number;
  };
  /**
   * Initial threads (optional)
   */
  initialThreads?: ChatThread[];
  /**
   * Initial messages (optional)
   */
  initialMessages?: Message[];
}

const ChatContainerWithApi = ({
  apiConfig,
  initialThreads = [],
  initialMessages = []
}: ChatContainerProps) => {
  // Chat history state
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(
    initialThreads.length > 0 ? initialThreads[0].id : null
  );
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // Current chat state
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Ref to track current thread ID for callbacks (avoids stale closures)
  const currentThreadIdRef = useRef<string | null>(currentThreadId);
  
  // Keep ref in sync with state
  useEffect(() => {
    currentThreadIdRef.current = currentThreadId;
  }, [currentThreadId]);

  // API integration
  const updateCurrentThreadWithMessages = useCallback((threadId: string, updatedMessages: Message[]) => {
    setThreads(prev =>
      prev.map(thread => {
        if (thread.id === threadId) {
            let preview = "";
            if (updatedMessages.length > 0) {
                const lastMessage = updatedMessages[updatedMessages.length - 1];

                if (lastMessage.type === "text") {
                    preview = lastMessage.content.substring(0, 100);
                } else if (lastMessage.type === "card") {
                    preview = lastMessage.content;
                } else {
                    preview = `${lastMessage.type} message`;
                }
            }

          return {
            ...thread,
            messages: updatedMessages,
            messageCount: updatedMessages.length,
            preview,
            timestamp: new Date()
          };
        }
        return thread;
      })
    );
  }, []);

  // Handle new incoming message from API
  const onMessageReceived = useCallback((message: Message) => {
    setMessages(prev => {
      const updatedMessages = [...prev, message];
      // Update the thread with the new messages using the current thread ID from ref
      if (currentThreadIdRef.current) {
        updateCurrentThreadWithMessages(currentThreadIdRef.current, updatedMessages);
      }
      return updatedMessages;
    });
  }, [updateCurrentThreadWithMessages]);

  // Handle API errors
  const onApiError = useCallback((errorMessage: string) => {
    console.error("API Error:", errorMessage);
  }, []);

  // Handle thread ID received from API
  const onThreadIdReceived = useCallback((threadId: string) => {
    // Update thread ID immediately when received from backend
    setCurrentThreadId(prevThreadId => {
      const isNewThread = prevThreadId === null || prevThreadId.startsWith('temp-');
      
      // If this is a new thread, replace the temp thread ID with the real one
      if (isNewThread && prevThreadId) {
        setThreads(prev => prev.map(thread => {
          if (thread.id === prevThreadId || thread.id.startsWith('temp-')) {
            return { ...thread, id: threadId };
          }
          return thread;
        }));
      }
      
      return threadId;
    });
  }, []);

  const chatApi = useChatApi(
    apiConfig,
    currentThreadId,
    messages,
    onMessageReceived,
    onApiError,
    onThreadIdReceived
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatApi.currentStreamContent]);

  // Handle sending a message, triggered by user action
  const handleSend = async () => {
    if (!input.trim() || !chatApi) return;

    const userMessage: TextMessage = {
      role: "user",
      type: "text",
      content: input,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // If no thread exists yet, create a temporary one
    if (currentThreadId === null) {
      const tempThreadId = `temp-${Date.now()}`;
      const newThread: ChatThread = {
        id: tempThreadId,
        title: "New Conversation",
        preview: input.substring(0, 100),
        timestamp: new Date(),
        messageCount: newMessages.length,
        messages: newMessages,
        tags: ["New"]
      };
      setThreads(prev => [newThread, ...prev]);
      setCurrentThreadId(tempThreadId);
    }
    
    // Send via API - thread ID will be received via onThreadIdReceived callback
    await chatApi.sendMessage(input);
  };

  // Reset chat to initial state, triggered by user action
  const resetChat = () => {
    setMessages([]);
    setInput("");
    
    // Clear the current thread messages
    if (currentThreadId) {
      updateCurrentThreadWithMessages(currentThreadId, []);
    }
    
    // Abort any ongoing streams
    if (chatApi) {
      chatApi.abortStream();
    }
  };

  // Handle feedback submission from messages
  const handleFeedbackSubmit = (response: any) => {
    console.log("Feedback received:", response);

    // Add a confirmation message
    const confirmationMessage: TextMessage = {
      role: "assistant",
      type: "text",
      content: `Received your ${response.feedbackType}. ${
        response.approved !== undefined
          ? response.approved
            ? "✅ Proceeding with the approved action..."
            : "❌ Action cancelled as per your decision."
          : response.choiceId
          ? `Selected option: ${response.choiceId}`
          : "Thank you for your input!"
      }`,
      timestamp: new Date()
    };

    setMessages(prev => {
      const updatedMessages = [...prev, confirmationMessage];
      if (currentThreadIdRef.current) {
        updateCurrentThreadWithMessages(currentThreadIdRef.current, updatedMessages);
      }
      return updatedMessages;
    });

    // TODO: Send feedback to API if in API mode
  };

  // History panel handlers
  // Handle thread selection
  const handleSelectThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setCurrentThreadId(threadId);
      setMessages(thread.messages);
    }
  };

  // Handle new chat creation
  const handleNewChat = () => {
    const firstMessage: TextMessage = {
      role: "assistant",
      type: "text",
      content: "Hello! How can I help you today?",
      timestamp: new Date()
    };

    // Create a temporary thread with temp ID
    const tempThreadId = `temp-${Date.now()}`;
    const newThread: ChatThread = {
      id: tempThreadId,
      title: "New Conversation",
      preview: "Start a new investment analysis...",
      timestamp: new Date(),
      messageCount: 1,
      messages: [firstMessage],
      tags: ["New"]
    };

    setThreads(prev => [newThread, ...prev]);
    // Set to temp ID so the new thread shows as active in the UI
    // Backend will still create a new thread because it receives null on first message
    setCurrentThreadId(tempThreadId);
    setMessages(newThread.messages);
    setInput("");
  };

  const isStreamingOrLoading = chatApi.isStreaming || chatApi.isLoading;

  return (
    <div className="flex h-[700px]">
      {/* Chat History Panel */}
      <ChatHistoryPanel
        threads={threads}
        currentThreadId={currentThreadId}
        isExpanded={isHistoryExpanded}
        onToggle={() => setIsHistoryExpanded(!isHistoryExpanded)}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="h-full flex flex-col p-4 m-4 ml-0">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground line-clamp-1">
                {threads.find(t => t.id === currentThreadId)?.title || "AI What-If Analysis"}
              </h3>
              {chatApi.isStreaming && (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
            </div>
            <div className="flex gap-1.5">
              {chatApi.isStreaming && (
                <Button
                  onClick={() => chatApi.abortStream()}
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs px-2"
                >
                  <StopCircle className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              )}
              <Button
                onClick={resetChat}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages Area with Fixed Height and Scrolling */}
          <ScrollArea className="flex-1 pr-3" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  onRestart={resetChat}
                />
              ))}
              {chatApi.currentStreamContent && (
                <div className="flex gap-2 justify-start">
                  <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="max-w-[80%] p-2.5 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                    {chatApi.currentStreamContent}
                    <span className="animate-pulse">▋</span>
                  </div>
                </div>
              )}
              {isStreamingOrLoading && !chatApi.currentStreamContent && (
                <div className="flex gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Invisible element for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Compact Input Area */}
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isStreamingOrLoading && handleSend()}
              placeholder="Ask a 'what if' question..."
              className="flex-1 h-9 text-sm"
              disabled={isStreamingOrLoading}
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="h-9 w-9"
              disabled={isStreamingOrLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatContainerWithApi;
