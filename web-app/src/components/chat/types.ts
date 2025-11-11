export type MessageRole = "user" | "assistant" | "system";

export type MessageType = "text" | "card" | "event" | "agent_output" | "reasoning" | "human_feedback" | "markdown_text" | "error";

export interface BaseMessage {
  role: MessageRole;
  type: MessageType;
  timestamp?: Date;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

export interface MarkdownTextMessage extends BaseMessage {
  type: "markdown_text";
  content: string;
  title?: string;
  snippetLength?: number; // Number of characters to show in snippet (default: 150)
}

export interface CardMessage extends BaseMessage {
  type: "card";
  title: string;
  content: string;
  data?: Record<string, any>;
  metrics?: Array<{
    label: string;
    value: string | number;
    trend?: "up" | "down" | "neutral";
  }>;
}

export interface EventStatusMessage extends BaseMessage {
  type: "event";
  eventName: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  description?: string;
  details?: string;
}

export interface AgentOutputMessage extends BaseMessage {
  type: "agent_output";
  agentName: string;
  output: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface ReasoningMessage extends BaseMessage {
  type: "reasoning";
  steps: Array<{
    step: number;
    description: string;
    result?: string;
  }>;
  conclusion?: string;
}

export type FeedbackType = "approval" | "info_request" | "choice" | "input";

export interface HumanFeedbackMessage extends BaseMessage {
  type: "human_feedback";
  feedbackType: FeedbackType;
  question: string;
  description?: string;
  // For approval type
  approvalData?: {
    action: string;
    details?: Record<string, any>;
  };
  // For choice type
  choices?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  // For input type
  inputConfig?: {
    placeholder?: string;
    multiline?: boolean;
    validation?: string;
  };
  // Callback data
  requestId?: string;
  onResponse?: (response: any) => void;
}

export interface ErrorMessage extends BaseMessage {
  type: "error";
  errorType: "system" | "validation" | "network" | "timeout" | "processing";
  title: string;
  message: string;
  errorCode?: string;
  details?: string;
  recoverable?: boolean;
  onRestart?: () => void;
}

export type Message = 
  | TextMessage 
  | MarkdownTextMessage
  | CardMessage 
  | EventStatusMessage 
  | AgentOutputMessage 
  | ReasoningMessage
  | HumanFeedbackMessage
  | ErrorMessage;
