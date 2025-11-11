// Re-export ChatContainer as ChatInterface for backward compatibility
import { ChatContainerWithApi, ChatContainer } from "@/components/chat";
import { Component, ReactNode } from "react";

class ChatErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Chat error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-destructive">
              Chat Error
            </h1>
            <p className="text-muted-foreground">
              {this.state.error?.message || "An error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ChatInterface = () => {
  return (
    <ChatErrorBoundary>
      <ChatContainerWithApi
        apiConfig={{
          apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
          enableSSE: true
        }}
      />
    </ChatErrorBoundary>
  );
}

export default ChatInterface;