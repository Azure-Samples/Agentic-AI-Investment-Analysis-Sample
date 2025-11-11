/**
 * Example messages demonstrating all message types in the chat system
 * Import and use these examples to test the chat components
 */

import type { Message } from "./types";

export const exampleMessages: Message[] = [
  // 1. Initial greeting (text message)
  {
    role: "assistant",
    type: "text",
    content: "Hello! I'll analyze this investment opportunity using our multi-agent system. Let me walk you through the process."
  },
  
  // 2. Event: Starting analysis
  {
    role: "assistant",
    type: "event",
    eventName: "Investment Analysis Workflow",
    status: "in_progress",
    description: "Initiating comprehensive analysis across multiple dimensions"
  },
  
  // 3. Agent Output: Market Analysis
  {
    role: "assistant",
    type: "agent_output",
    agentName: "Market Analysis Agent",
    output: "The target market demonstrates strong fundamentals with a projected CAGR of 18% over the next 5 years. Key growth drivers include digital transformation and regulatory tailwinds in the sector.",
    confidence: 0.87,
    metadata: {
      "Data Sources": 8,
      "Market Size": "$4.2B",
      "Competitors Analyzed": 12
    }
  },
  
  // 4. Reasoning: Financial evaluation
  {
    role: "assistant",
    type: "reasoning",
    steps: [
      {
        step: 1,
        description: "Analyze historical revenue trends",
        result: "45% YoY growth over past 3 years"
      },
      {
        step: 2,
        description: "Evaluate cost structure and margins",
        result: "Gross margin of 68%, improving by 3% annually"
      },
      {
        step: 3,
        description: "Assess cash flow and burn rate",
        result: "Positive cash flow in last 2 quarters"
      },
      {
        step: 4,
        description: "Compare valuation to industry benchmarks",
        result: "Valuation at 0.8x industry average"
      }
    ],
    conclusion: "Strong financial performance with attractive valuation metrics. The company shows sustainable growth with improving unit economics."
  },
  
  // 5. Event: Completed sub-analysis
  {
    role: "assistant",
    type: "event",
    eventName: "Financial Analysis",
    status: "completed",
    description: "Revenue, profitability, and cash flow analysis completed",
    details: "Analyzed 5 years of financial statements and projections"
  },
  
  // 6. Agent Output: Risk Assessment
  {
    role: "assistant",
    type: "agent_output",
    agentName: "Risk Assessment Agent",
    output: "Overall risk rating: Medium. Primary risks include market concentration (35% revenue from top 3 clients) and competitive pressures. However, strong IP portfolio and customer retention rate of 95% mitigate these concerns.",
    confidence: 0.92,
    metadata: {
      "Risk Factors Identified": 7,
      "Mitigation Strategies": 5,
      "Regulatory Compliance": "98%"
    }
  },
  
  // 7. Card: Summary Results
  {
    role: "assistant",
    type: "card",
    title: "Investment Analysis Summary",
    content: "Comprehensive analysis completed across financial, market, and risk dimensions",
    metrics: [
      { label: "Overall Score", value: 82, trend: "up" },
      { label: "ROI Projection", value: "28%", trend: "up" },
      { label: "Risk Level", value: "Medium", trend: "neutral" },
      { label: "Confidence", value: "89%", trend: "up" }
    ],
    data: {
      "Recommendation": "INVEST",
      "Target Allocation": "15% of portfolio",
      "Investment Horizon": "3-5 years",
      "Exit Strategy": "Strategic acquisition or IPO"
    }
  },
  
  // 8. User question
  {
    role: "user",
    type: "text",
    content: "What if the market growth rate is only 10% instead of 18%?"
  },
  
  // 9. Reasoning: Scenario analysis
  {
    role: "assistant",
    type: "reasoning",
    steps: [
      {
        step: 1,
        description: "Adjust market size projections based on 10% CAGR",
        result: "Reduced addressable market by $800M over 5 years"
      },
      {
        step: 2,
        description: "Recalculate company revenue projections",
        result: "Revenue growth drops from 45% to 32% YoY"
      },
      {
        step: 3,
        description: "Update valuation multiples",
        result: "Valuation multiple adjusts from 6.5x to 5.2x revenue"
      },
      {
        step: 4,
        description: "Reassess risk-reward profile",
        result: "Risk increases slightly, but still within acceptable range"
      }
    ],
    conclusion: "Even with conservative 10% market growth, the opportunity remains attractive with adjusted ROI of 21% vs original 28%."
  },
  
  // 10. Card: Updated scenario results
  {
    role: "assistant",
    type: "card",
    title: "Conservative Scenario Results",
    content: "Analysis with 10% market CAGR assumption",
    metrics: [
      { label: "Overall Score", value: 76, trend: "down" },
      { label: "ROI Projection", value: "21%", trend: "down" },
      { label: "Risk Level", value: "Medium", trend: "neutral" },
      { label: "Confidence", value: "91%", trend: "up" }
    ],
    data: {
      "Recommendation": "INVEST (with caution)",
      "Target Allocation": "12% of portfolio",
      "Sensitivity": "Moderate to market conditions",
      "Adjusted Valuation": "$24M vs $28M base case"
    }
  },
  
  // 11. Event: Analysis workflow complete
  {
    role: "assistant",
    type: "event",
    eventName: "Investment Analysis Workflow",
    status: "completed",
    description: "All analyses completed including scenario modeling",
    details: "3 agents collaborated over 12.5 seconds to produce comprehensive analysis"
  },
  
  // 12. Final text message
  {
    role: "assistant",
    type: "text",
    content: "I've completed the analysis including your scenario question. The investment remains attractive even under conservative assumptions. Would you like to explore any other scenarios or dive deeper into specific aspects?"
  }
];

/**
 * Example human feedback messages demonstrating human-in-the-loop scenarios
 */
export const humanFeedbackExamples: Message[] = [
  // Approval Request Example
  {
    role: "assistant",
    type: "human_feedback",
    feedbackType: "approval",
    question: "Approval Required: Proceed with Investment?",
    description: "Based on the analysis, I recommend proceeding with this investment. Please review and approve.",
    approvalData: {
      action: "Execute Investment Transaction",
      details: {
        "Investment Amount": "$500,000",
        "Target Company": "TechStart AI Inc.",
        "Recommended Allocation": "15% of portfolio",
        "Risk Level": "Medium",
        "Expected ROI": "28% over 3 years"
      }
    },
    requestId: "approval-001"
  },

  // Info Request Example
  {
    role: "assistant",
    type: "human_feedback",
    feedbackType: "info_request",
    question: "Additional Information Needed",
    description: "To complete the risk assessment, I need more details about the company's intellectual property portfolio.",
    inputConfig: {
      placeholder: "Please describe the IP portfolio, including patents, trademarks, and proprietary technology...",
      multiline: true
    },
    requestId: "info-001"
  },

  // Choice Request Example
  {
    role: "assistant",
    type: "human_feedback",
    feedbackType: "choice",
    question: "Select Analysis Depth",
    description: "How would you like me to proceed with the financial analysis?",
    choices: [
      {
        id: "quick",
        label: "Quick Analysis",
        description: "High-level overview with key metrics (2-3 minutes)"
      },
      {
        id: "standard",
        label: "Standard Analysis",
        description: "Comprehensive analysis with detailed breakdowns (5-7 minutes)"
      },
      {
        id: "deep",
        label: "Deep Dive Analysis",
        description: "Exhaustive analysis including stress testing and Monte Carlo simulations (15-20 minutes)"
      }
    ],
    requestId: "choice-001"
  },

  // Input Request Example
  {
    role: "assistant",
    type: "human_feedback",
    feedbackType: "input",
    question: "Specify Target Valuation",
    description: "What maximum valuation are you willing to consider for this investment?",
    inputConfig: {
      placeholder: "e.g., $50M",
      multiline: false,
      validation: "Enter amount in millions (e.g., $50M)"
    },
    requestId: "input-001"
  },

  // Approval with Risk Warning
  {
    role: "assistant",
    type: "human_feedback",
    feedbackType: "approval",
    question: "⚠️ High-Risk Investment Approval Required",
    description: "This investment has been flagged as high-risk due to market volatility and limited financial history. Please carefully review before approving.",
    approvalData: {
      action: "Proceed with High-Risk Investment",
      details: {
        "Risk Score": "78/100 (High)",
        "Market Volatility": "High",
        "Financial History": "18 months",
        "Recommended Allocation": "5% maximum",
        "Exit Strategy": "2-year lockup period"
      }
    },
    requestId: "approval-002"
  },

  // Multiple Choice for Strategy
  {
    role: "assistant",
    type: "human_feedback",
    feedbackType: "choice",
    question: "Choose Investment Strategy",
    description: "Based on the analysis, I've identified three viable investment strategies. Which approach would you prefer?",
    choices: [
      {
        id: "aggressive",
        label: "Aggressive Growth",
        description: "Higher allocation (20%), targeting 35%+ ROI with increased risk exposure"
      },
      {
        id: "balanced",
        label: "Balanced Approach",
        description: "Moderate allocation (15%), targeting 28% ROI with medium risk"
      },
      {
        id: "conservative",
        label: "Conservative Entry",
        description: "Lower allocation (8%), targeting 18% ROI with minimized risk"
      },
      {
        id: "staged",
        label: "Staged Investment",
        description: "Start with 5%, increase to 15% based on milestone achievements"
      }
    ],
    requestId: "choice-002"
  }
];

// Example markdown messages
export const markdownMessageExamples: Message[] = [
  // Short markdown that doesn't need expansion
  {
    role: "assistant",
    type: "markdown_text",
    title: "Quick Summary",
    content: "**Investment Recommendation:** Proceed with caution\n\n*Risk Level:* Medium-High"
  },

  // Long markdown report that shows snippet and expands
  {
    role: "assistant",
    type: "markdown_text",
    title: "Detailed Investment Analysis Report",
    content: `# Investment Analysis: TechStart AI Solutions

## Executive Summary

TechStart AI Solutions presents a compelling investment opportunity in the rapidly growing artificial intelligence sector. Our comprehensive analysis indicates strong fundamentals with moderate risk exposure.

### Key Highlights

- **Valuation:** $45M pre-money
- **Revenue Growth:** 180% YoY
- **Market Opportunity:** $12B TAM
- **Team Experience:** 45+ years combined in AI/ML

## Financial Analysis

### Revenue Performance

The company has demonstrated exceptional revenue growth over the past three years:

- **2023:** $2.1M (+180% YoY)
- **2022:** $750K (+220% YoY)  
- **2021:** $234K (Initial revenue)

### Profitability Metrics

Current burn rate is well-managed at $180K/month with 18 months of runway remaining. The company projects profitability within 24 months based on:

1. Expanding enterprise customer base
2. Improved gross margins (currently 68%)
3. Operational efficiency gains

## Market Analysis

### Target Market

The AI solutions market for enterprise customers is experiencing rapid expansion:

- **Current Market Size:** $4.2B
- **Projected CAGR:** 28.5% (2024-2029)
- **Target Segment:** Mid-market enterprises ($50M-$500M revenue)

### Competitive Landscape

**Key Competitors:**
- DataCorp AI (Market Leader, 23% share)
- IntelliSoft Solutions (Fast follower, 15% share)
- CloudMind Systems (Niche player, 8% share)

**Competitive Advantages:**
- Proprietary ML algorithms (2 patents pending)
- 40% faster implementation time
- Superior customer retention (94% vs. industry avg 78%)

## Risk Assessment

### High-Priority Risks

1. **Market Risk:** Increasing competition from well-funded startups
2. **Technology Risk:** Rapid AI advancement may obsolete current platform
3. **Key Person Risk:** Heavy reliance on CTO for technical innovation

### Mitigation Strategies

- Accelerate R&D investment (20% of budget)
- Build redundant technical leadership
- Establish strategic partnerships with major cloud providers

## Investment Terms

### Proposed Structure

- **Investment Amount:** $8M Series A
- **Valuation:** $45M pre-money, $53M post-money
- **Equity Stake:** 15.1%
- **Board Seat:** Yes (investor director)
- **Liquidation Preference:** 1x non-participating

### Key Conditions

1. Hiring of CFO within 90 days
2. Implementation of financial controls
3. Quarterly board reporting
4. Right of first refusal on Series B

## Recommendation

**Rating:** INVEST with conditions

We recommend proceeding with this investment opportunity subject to the following:

- Due diligence verification of customer contracts
- Technical audit of IP and codebase
- Reference checks on leadership team
- Legal review of cap table and prior agreements

**Expected Returns:**
- Base Case: 3.2x MOIC over 5 years
- Bull Case: 6.5x MOIC over 4 years  
- Bear Case: 1.1x MOIC over 6 years

---

*Report prepared by AI Investment Analysis System*  
*Date: November 11, 2025*
*Confidence Level: High (87%)*`,
    snippetLength: 200
  },

  // Technical documentation example
  {
    role: "assistant",
    type: "markdown_text",
    title: "API Integration Guide",
    content: `# Investment API Integration Guide

## Overview

This guide covers the integration process for connecting to our Investment Analysis API.

## Authentication

Use Bearer token authentication:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### POST /api/analysis/create
Create a new investment analysis request.

### GET /api/analysis/{id}
Retrieve analysis results.

## Rate Limits

- **Free Tier:** 100 requests/day
- **Pro Tier:** 1000 requests/day
- **Enterprise:** Unlimited

## Support

Contact support@investment-api.com for assistance.`,
    snippetLength: 180
  },

  // User markdown message
  {
    role: "user",
    type: "markdown_text",
    content: `Please analyze this opportunity:

## Company Details
- **Name:** GreenTech Innovations
- **Sector:** Clean Energy
- **Stage:** Series B

## Request
Focus on sustainability metrics and ESG compliance.`
  }
];

// Error message examples
export const errorMessageExamples: Message[] = [
  // System Error
  {
    role: "assistant",
    type: "error",
    errorType: "system",
    title: "System Error",
    message: "An unexpected error occurred while processing your request. Our team has been notified.",
    errorCode: "SYS_ERR_500",
    details: "Internal server error: Failed to initialize analysis workflow\nTimestamp: 2025-11-11T10:30:45Z\nRequest ID: req_abc123xyz",
    recoverable: true
  },

  // Network Error
  {
    role: "assistant",
    type: "error",
    errorType: "network",
    title: "Connection Error",
    message: "Unable to connect to the analysis service. Please check your internet connection and try again.",
    errorCode: "NET_ERR_CONN_REFUSED",
    details: "Failed to reach api.investment-analysis.com\nConnection timeout after 30 seconds\nRetried 3 times",
    recoverable: true
  },

  // Timeout Error
  {
    role: "assistant",
    type: "error",
    errorType: "timeout",
    title: "Request Timeout",
    message: "The analysis is taking longer than expected. The request has timed out.",
    errorCode: "TIMEOUT_ERR_408",
    details: "Analysis workflow exceeded maximum execution time (120 seconds)\nAgent: Market Analysis Agent\nStep: Competitor analysis",
    recoverable: true
  },

  // Validation Error
  {
    role: "assistant",
    type: "error",
    errorType: "validation",
    title: "Validation Error",
    message: "The provided company data is incomplete or invalid. Please provide all required information.",
    errorCode: "VAL_ERR_001",
    details: "Missing required fields:\n- Company valuation\n- Revenue data (last 3 years)\n- Team information\n\nInvalid fields:\n- Funding amount (must be positive number)",
    recoverable: true
  },

  // Processing Error
  {
    role: "assistant",
    type: "error",
    errorType: "processing",
    title: "Processing Error",
    message: "Failed to complete the financial analysis. Some data sources are currently unavailable.",
    errorCode: "PROC_ERR_DATA_001",
    details: "Data source failures:\n- Market data provider: Unavailable\n- Financial metrics API: Rate limit exceeded\n- Competitor database: Maintenance mode\n\nPartial results may be available.",
    recoverable: true
  },

  // Non-recoverable system error
  {
    role: "assistant",
    type: "error",
    errorType: "system",
    title: "Critical System Error",
    message: "A critical error has occurred. Please contact support with the error code below.",
    errorCode: "CRIT_ERR_FATAL_001",
    details: "Fatal error in workflow executor\nStack trace:\n  at WorkflowExecutor.execute()\n  at InvestmentAnalysisService.analyze()\n  at APIHandler.post()",
    recoverable: false
  }
];
