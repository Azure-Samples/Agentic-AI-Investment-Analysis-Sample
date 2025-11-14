import { ChatConversation } from "./chatHistoryTypes";
import { exampleMessages } from "./exampleMessages";
import type { Message } from "./types";

// Helper to create thread from messages
const createThread = (
  id: string,
  title: string,
  messages: Message[],
  tags?: string[]
): ChatConversation => {
  const lastMessage = messages[messages.length - 1];
  let preview = "";
  
  if (lastMessage.type === "text") {
    preview = lastMessage.content.substring(0, 100);
  } else if (lastMessage.type === "card") {
    preview = lastMessage.content;
  } else if (lastMessage.type === "event") {
    preview = lastMessage.description || lastMessage.eventName;
  } else if (lastMessage.type === "agent_output") {
    preview = lastMessage.output.substring(0, 100);
  } else {
    preview = `${lastMessage.type} message`;
  }

  return {
    id,
    title,
    preview,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
    messageCount: messages.length,
    messages,
    tags,
  };
};

export const mockChatThreads: ChatConversation[] = [
  createThread(
    "thread-1",
    "TechStart AI Investment Analysis",
    exampleMessages.slice(0, 7),
    ["Investment", "High Priority"]
  ),
  
  createThread(
    "thread-2",
    "Market Growth Scenario Analysis",
    [
      exampleMessages[0],
      exampleMessages[7],
      exampleMessages[8],
      exampleMessages[9],
      exampleMessages[10],
    ],
    ["Scenario", "Analysis"]
  ),

  createThread(
    "thread-3",
    "GreenTech Solutions Due Diligence",
    [
      {
        role: "assistant",
        type: "text",
        content: "Starting due diligence for GreenTech Solutions..."
      },
      {
        role: "assistant",
        type: "event",
        eventName: "Financial Review",
        status: "completed",
        description: "Completed comprehensive financial analysis"
      },
      {
        role: "assistant",
        type: "agent_output",
        agentName: "Compliance Agent",
        output: "All regulatory requirements met. ESG score: 92/100",
        confidence: 0.95
      },
      {
        role: "assistant",
        type: "card",
        title: "Due Diligence Summary",
        content: "Comprehensive review completed",
        metrics: [
          { label: "Compliance", value: "98%", trend: "up" },
          { label: "ESG Score", value: 92, trend: "up" },
          { label: "Risk Level", value: "Low", trend: "neutral" }
        ]
      }
    ],
    ["Due Diligence", "ESG"]
  ),

  createThread(
    "thread-4",
    "Portfolio Rebalancing Strategy",
    [
      {
        role: "assistant",
        type: "text",
        content: "Let's review your current portfolio allocation..."
      },
      {
        role: "user",
        type: "text",
        content: "Show me the current allocation breakdown"
      },
      {
        role: "assistant",
        type: "card",
        title: "Current Portfolio Allocation",
        content: "Your portfolio across asset classes",
        metrics: [
          { label: "Tech", value: "35%", trend: "up" },
          { label: "Healthcare", value: "25%", trend: "neutral" },
          { label: "Finance", value: "20%", trend: "down" },
          { label: "Energy", value: "20%", trend: "up" }
        ]
      },
      {
        role: "assistant",
        type: "human_feedback",
        feedbackType: "choice",
        question: "Rebalancing Strategy",
        description: "Which approach would you prefer?",
        choices: [
          { id: "aggressive", label: "Aggressive", description: "Increase tech to 45%" },
          { id: "moderate", label: "Moderate", description: "Maintain current" },
          { id: "conservative", label: "Conservative", description: "Reduce volatility" }
        ]
      }
    ],
    ["Portfolio", "Strategy"]
  ),

  createThread(
    "thread-5",
    "HealthTech Innovations Risk Assessment",
    [
      {
        role: "assistant",
        type: "text",
        content: "Beginning risk assessment for HealthTech Innovations..."
      },
      {
        role: "assistant",
        type: "reasoning",
        steps: [
          { step: 1, description: "Analyze regulatory landscape", result: "FDA approval pending for 2 products" },
          { step: 2, description: "Evaluate competitive position", result: "Strong IP portfolio with 15 patents" },
          { step: 3, description: "Review financial stability", result: "18 months runway, break-even in Q3" }
        ],
        conclusion: "Medium-high risk with strong growth potential"
      },
      {
        role: "assistant",
        type: "agent_output",
        agentName: "Risk Assessment Agent",
        output: "Overall risk score: 68/100 (Medium-High). Primary concerns: regulatory approval timeline and cash runway.",
        confidence: 0.88,
        metadata: {
          "Risk Factors": 8,
          "Mitigations": 5
        }
      }
    ],
    ["Risk", "Healthcare"]
  ),

  createThread(
    "thread-6",
    "Q4 Investment Review Meeting",
    [
      {
        role: "assistant",
        type: "text",
        content: "Preparing Q4 investment review..."
      },
      {
        role: "assistant",
        type: "card",
        title: "Q4 Performance Summary",
        content: "Portfolio performance overview",
        metrics: [
          { label: "Total Return", value: "12.4%", trend: "up" },
          { label: "vs Benchmark", value: "+3.2%", trend: "up" },
          { label: "New Positions", value: 4, trend: "up" },
          { label: "Exits", value: 2, trend: "neutral" }
        ],
        data: {
          "Best Performer": "TechStart AI (+45%)",
          "Underperformer": "RetailCo (-8%)",
          "Total AUM": "$4.2M"
        }
      }
    ],
    ["Review", "Q4"]
  ),

  createThread(
    "thread-7",
    "AI Startup Valuation Discussion",
    [
      {
        role: "user",
        type: "text",
        content: "What's a fair valuation for an early-stage AI startup with $500K ARR?"
      },
      {
        role: "assistant",
        type: "reasoning",
        steps: [
          { step: 1, description: "Consider ARR multiple for AI sector", result: "Typical range: 10-20x ARR" },
          { step: 2, description: "Adjust for growth rate", result: "Assuming 200% YoY: +2-5x premium" },
          { step: 3, description: "Factor in competitive moat", result: "Strong IP: +1-2x premium" }
        ],
        conclusion: "Fair valuation range: $6M - $13.5M"
      }
    ],
    ["Valuation", "AI"]
  ),

  createThread(
    "thread-8",
    "New Investment Opportunity Screening",
    [
      {
        role: "assistant",
        type: "text",
        content: "I've identified 3 new opportunities that match your criteria..."
      },
      {
        role: "assistant",
        type: "event",
        eventName: "Opportunity Screening",
        status: "in_progress",
        description: "Analyzing 3 potential investments"
      }
    ],
    ["Screening", "New"]
  )
];
