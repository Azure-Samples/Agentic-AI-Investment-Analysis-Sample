/**
 * Example implementations of the Chat API integration
 * 
 * This file shows various ways to use ChatContainerWithApi
 * in your application.
 */

import { useState } from "react";
import { ChatContainerWithApi, ChatContainer } from "@/components/chat";
import { 
  exampleMessages, 
  humanFeedbackExamples,
  markdownMessageExamples,
  errorMessageExamples,
  mockChatThreads 
} from "@/components/chat";

// ============================================================================
// Example 1: Pure API Mode (Production)
// ============================================================================

export function ProductionChatApp() {
  const apiConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
    enableSSE: true,
    timeout: 30000
  };

  return (
    <div className="h-screen">
      <ChatContainerWithApi
        apiConfig={apiConfig}
        initialThreads={[]}
        initialMessages={[]}
      />
    </div>
  );
}

// ============================================================================
// Example 2b: Original ChatContainer (No Props)
// ============================================================================

export function OriginalChatApp() {
  // The original ChatContainer has no props - uses built-in mock data
  return (
    <div className="h-screen">
      <ChatContainer />
    </div>
  );
}

// ============================================================================
// Example 4: With Custom Configuration
// ============================================================================

export function CustomConfigChatApp() {
  const [sseEnabled, setSseEnabled] = useState(true);
  const [timeout, setTimeout] = useState(30000);
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/api");

  const apiConfig = {
    apiBaseUrl: apiUrl,
    enableSSE: sseEnabled,
    timeout: timeout
  };

  return (
    <div className="h-screen flex">
      {/* Settings Panel */}
      <div className="w-80 bg-muted p-4 border-r space-y-4">
        <h2 className="font-semibold text-lg">API Configuration</h2>
        
        <div>
          <label className="text-sm font-medium block mb-1">API URL</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full px-3 py-1.5 border rounded text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Timeout (ms)</label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            className="w-full px-3 py-1.5 border rounded text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sseEnabled}
              onChange={(e) => setSseEnabled(e.target.checked)}
            />
            <span className="text-sm font-medium">Enable SSE Streaming</span>
          </label>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {sseEnabled 
              ? "✅ Real-time streaming enabled" 
              : "⚠️ Using polling fallback"}
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1">
        <ChatContainerWithApi apiConfig={apiConfig} />
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: With Authentication
// ============================================================================

export function AuthenticatedChatApp() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("auth_token")
  );

  const apiConfig = token ? {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
    enableSSE: true,
    timeout: 30000,
    // Note: You'd need to extend ChatApiService to support custom headers
    // headers: {
    //   Authorization: `Bearer ${token}`
    // }
  } : undefined;

  const handleLogin = async () => {
    // Simulate login
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
    localStorage.setItem("auth_token", mockToken);
    setToken(mockToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please Login</h1>
          <button
            onClick={handleLogin}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
        <h1 className="font-semibold">Investment Analysis Chat</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 bg-primary-foreground text-primary rounded-md text-sm"
        >
          Logout
        </button>
      </div>
      <ChatContainerWithApi apiConfig={apiConfig} />
    </div>
  );
}

// ============================================================================
// Example 6: With Context/Portfolio Integration
// ============================================================================

export function PortfolioChatApp() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("port-123");
  const portfolios = [
    { id: "port-123", name: "Growth Portfolio" },
    { id: "port-456", name: "Conservative Portfolio" },
    { id: "port-789", name: "Balanced Portfolio" }
  ];

  // You would need to extend the API to support context
  const apiConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
    enableSSE: true,
    timeout: 30000,
    // Note: This would require extending the API implementation
    // context: {
    //   portfolioId: selectedPortfolioId
    // }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Portfolio Selector */}
      <div className="bg-muted p-3 border-b flex items-center gap-3">
        <span className="text-sm font-medium">Portfolio:</span>
        <select
          value={selectedPortfolioId}
          onChange={(e) => setSelectedPortfolioId(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm"
        >
          {portfolios.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <ChatContainerWithApi apiConfig={apiConfig} />
    </div>
  );
}

// ============================================================================
// Example 7: Minimal Integration
// ============================================================================

export function MinimalChatApp() {
  return (
    <ChatContainerWithApi
      apiConfig={{
        apiBaseUrl: "http://localhost:8000/api",
        enableSSE: true
      }}
    />
  );
}

// ============================================================================
// Example 8: With Error Boundaries
// ============================================================================

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

export function SafeChatApp() {
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
