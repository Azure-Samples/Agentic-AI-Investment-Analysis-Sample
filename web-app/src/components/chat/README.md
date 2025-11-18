# Chat Components

A modular chat component system that supports multiple message types for displaying AI agent interactions, status updates, and structured data.

## Components

### ChatMessage
Main component that routes to appropriate message renderer based on message type.

```tsx
import { ChatMessage, Message } from "@/components/chat";

<ChatMessage message={message} />
```

### Message Types

#### 1. TextMessage
Standard text messages for user and assistant interactions.

```tsx
const message: TextMessage = {
  role: "user" | "assistant",
  type: "text",
  content: "Your message here"
};
```

#### 2. CardMessage
Structured data displayed as cards with optional metrics and key-value data.

```tsx
const message: CardMessage = {
  role: "assistant",
  type: "card",
  title: "Investment Analysis",
  content: "Summary of the analysis results",
  metrics: [
    { label: "ROI", value: "23%", trend: "up" },
    { label: "Risk Score", value: 65, trend: "down" }
  ],
  data: {
    "Market Size": "$2.5B",
    "Growth Rate": "15% YoY"
  }
};
```

#### 3. EventStatusMessage
Display workflow events and their status with visual indicators.

```tsx
const message: EventStatusMessage = {
  role: "assistant",
  type: "event",
  eventName: "Financial Analysis",
  status: "completed" | "in_progress" | "pending" | "failed",
  description: "Analyzing revenue projections and cost structure",
  details: "Processed 5 years of historical data"
};
```

#### 4. AgentOutputMessage
Show outputs from specific AI agents with confidence scores.

```tsx
const message: AgentOutputMessage = {
  role: "assistant",
  type: "agent_output",
  agentName: "Market Analysis Agent",
  output: "The target market shows strong growth potential...",
  confidence: 0.92,
  metadata: {
    "Sources": 5,
    "Processing Time": "2.3s"
  }
};
```

#### 5. ReasoningMessage
Display step-by-step reasoning process with conclusions.

```tsx
const message: ReasoningMessage = {
  role: "assistant",
  type: "reasoning",
  steps: [
    {
      step: 1,
      description: "Analyze financial statements",
      result: "Revenue growth of 45% YoY"
    },
    {
      step: 2,
      description: "Evaluate market conditions",
      result: "Favorable market trends identified"
    }
  ],
  conclusion: "Strong investment opportunity with moderate risk"
};
```

#### 6. HumanFeedbackMessage
Request human input for human-in-the-loop workflows with different feedback types.

**Approval Request:**
```tsx
const message: HumanFeedbackMessage = {
  role: "assistant",
  type: "human_feedback",
  feedbackType: "approval",
  question: "Approval Required: Proceed with Investment?",
  description: "Based on the analysis, I recommend proceeding with this investment.",
  approvalData: {
    action: "Execute Investment Transaction",
    details: {
      "Investment Amount": "$500,000",
      "Risk Level": "Medium"
    }
  },
  requestId: "approval-001",
  onResponse: (response) => console.log("Approval response:", response)
};
```

**Info Request:**
```tsx
const message: HumanFeedbackMessage = {
  role: "assistant",
  type: "human_feedback",
  feedbackType: "info_request",
  question: "Additional Information Needed",
  description: "Please provide more details about the IP portfolio.",
  inputConfig: {
    placeholder: "Describe the IP portfolio...",
    multiline: true
  },
  requestId: "info-001"
};
```

**Choice Request:**
```tsx
const message: HumanFeedbackMessage = {
  role: "assistant",
  type: "human_feedback",
  feedbackType: "choice",
  question: "Select Analysis Depth",
  description: "How would you like to proceed?",
  choices: [
    { id: "quick", label: "Quick Analysis", description: "2-3 minutes" },
    { id: "standard", label: "Standard Analysis", description: "5-7 minutes" },
    { id: "deep", label: "Deep Dive", description: "15-20 minutes" }
  ],
  requestId: "choice-001"
};
```

**Input Request:**
```tsx
const message: HumanFeedbackMessage = {
  role: "assistant",
  type: "human_feedback",
  feedbackType: "input",
  question: "Specify Target Valuation",
  description: "What maximum valuation are you willing to consider?",
  inputConfig: {
    placeholder: "e.g., $50M",
    validation: "Enter amount in millions"
  },
  requestId: "input-001"
};
```

## Usage Example

```tsx
import { useState } from "react";
import { ChatMessage, Message } from "@/components/chat";

function MyChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      type: "text",
      content: "Hello! How can I help you today?"
    },
    {
      role: "assistant",
      type: "event",
      eventName: "Processing Documents",
      status: "in_progress",
      description: "Extracting data from uploaded files"
    },
    {
      role: "assistant",
      type: "card",
      title: "Quick Stats",
      content: "Current portfolio overview",
      metrics: [
        { label: "Total Value", value: "$1.2M", trend: "up" },
        { label: "Monthly Return", value: "8.5%", trend: "up" }
      ]
    },
    {
      role: "assistant",
      type: "human_feedback",
      feedbackType: "approval",
      question: "Approve this investment?",
      description: "Review the analysis and approve or reject",
      approvalData: {
        action: "Execute Investment",
        details: { "Amount": "$250K" }
      }
    }
  ]);

  const handleFeedback = (response: any) => {
    console.log("Feedback received:", response);
    // Handle the feedback response
    setMessages(prev => [...prev, {
      role: "assistant",
      type: "text",
      content: `Thank you for your ${response.feedbackType}!`
    }]);
  };

  return (
    <div className="space-y-4">
      {messages.map((msg, idx) => (
        <ChatMessage 
          key={idx} 
          message={msg} 
          onFeedbackSubmit={handleFeedback}
        />
      ))}
    </div>
  );
}
```

## Type Exports

All types are exported from the `types.ts` file and can be imported as:

```tsx
import type { 
  Message, 
  TextMessage, 
  CardMessage, 
  EventStatusMessage,
  AgentOutputMessage,
  ReasoningMessage,
  HumanFeedbackMessage,
  FeedbackType
} from "@/components/chat";
```
