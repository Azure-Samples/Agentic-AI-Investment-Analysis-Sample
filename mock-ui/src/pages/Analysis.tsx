import { useState } from "react";
import { ArrowLeft, Brain, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Play, Clock, FileText, Expand, Copy, Check, FileCheck, FileX, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import AgentWorkflow from "@/components/AgentWorkflow";
import ChatInterface from "@/components/ChatInterface";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Analysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string>("run-1");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [analysisRunName, setAnalysisRunName] = useState("");
  const [investmentHypothesis, setInvestmentHypothesis] = useState("");
  const [isAgentDetailOpen, setIsAgentDetailOpen] = useState(false);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [completedAgents, setCompletedAgents] = useState<string[]>([
    'financial', 'risk', 'market', 'compliance', 'challenger', 'supporter', 'summary'
  ]);

  const opportunityName = "TechCo Series B Investment";

  // Document processing status
  const [documents] = useState({
    total: 5,
    pending: 0,
    processing: 0,
    completed: 5,
    error: 0,
  });

  const allDocumentsProcessed = documents.completed === documents.total && documents.total > 0;
  const hasDocuments = documents.total > 0;
  const processingProgress = hasDocuments ? Math.round((documents.completed / documents.total) * 100) : 0;

  const analysisRuns = [
    {
      id: "run-1",
      name: "TechCo Series B Analysis",
      date: "2025-10-28",
      time: "14:30",
      status: "complete",
      overallScore: 79,
    },
    {
      id: "run-2",
      name: "FinanceApp Due Diligence",
      date: "2025-10-25",
      time: "09:15",
      status: "complete",
      overallScore: 82,
    },
    {
      id: "run-3",
      name: "HealthTech Startup Review",
      date: "2025-10-22",
      time: "16:45",
      status: "complete",
      overallScore: 71,
    },
  ];

  const insights = {
    financial: [
      "Revenue growth of 23% YoY demonstrates strong market traction",
      "EBITDA margin of 18% is above industry average",
    ],
    risk: [
      "High customer concentration risk - top 3 clients represent 60% of revenue",
      "Technology infrastructure requires modernization investment",
    ],
    market: [
      "Total addressable market estimated at $12B with 15% CAGR",
      "Strong competitive positioning in mid-market segment",
    ],
    compliance: [
      "All regulatory filings are current and complete",
      "Corporate governance structure meets institutional standards",
    ],
    challenger: [
      "High valuation relative to current revenue multiples",
      "Unproven scalability in international markets",
    ],
    supporter: [
      "Strong product-market fit with expanding customer base",
      "Experienced leadership team with successful track record",
    ],
    summary: [
      "Investment score: 79/100 - Recommend proceeding with caution",
      "Overall risk level: Medium with strong upside potential",
    ],
  };

  const agents = [
    {
      id: "financial",
      name: "Financial Analysis Agent",
      status: "complete",
      icon: BarChart3,
      score: 78,
      color: "bg-blue-500",
      keyInsights: insights.financial,
      fullReport: `# Financial Analysis Report

## Executive Summary
The financial analysis reveals a company with strong fundamentals and promising growth trajectory. Revenue growth of 23% YoY demonstrates market traction, while maintaining healthy profitability metrics.

## Key Metrics
- **Revenue Growth**: 23% YoY
- **EBITDA Margin**: 18% (above industry average of 12%)
- **Cash Runway**: 18 months
- **Burn Rate**: $500K/month

## Strengths
1. Consistent revenue growth over past 3 years
2. Improving unit economics
3. Strong gross margins (65%)
4. Diversifying revenue streams

## Concerns
1. Customer acquisition costs trending upward
2. Working capital requirements increasing
3. Dependency on venture funding for growth

## Recommendation
**Score: 78/100** - Solid financial foundation with room for optimization in cost structure.`,
    },
    {
      id: "risk",
      name: "Risk Assessment Agent",
      status: "complete",
      icon: AlertTriangle,
      score: 65,
      color: "bg-orange-500",
      keyInsights: insights.risk,
      fullReport: `# Risk Assessment Report

## Executive Summary
The risk analysis identifies several areas of concern that require mitigation strategies. While no critical blockers exist, customer concentration and technology infrastructure present notable risks.

## Major Risks Identified

### High Impact Risks
1. **Customer Concentration** (High)
   - Top 3 clients represent 60% of revenue
   - Loss of any major client would significantly impact financials
   - Mitigation: Diversification strategy needed

2. **Technology Infrastructure** (Medium)
   - Legacy systems requiring modernization
   - Technical debt estimated at 6 months dev time
   - Security vulnerabilities in older components

### Medium Impact Risks
1. **Geographic Concentration** (Medium)
   - 80% of revenue from single market
   - Currency exposure not hedged
   - Regulatory changes could impact operations

2. **Key Person Risk** (Medium)
   - Heavy reliance on founding team
   - Limited succession planning
   - Knowledge concentration

## Mitigation Strategies
- Implement customer diversification program
- Allocate resources for technical debt reduction
- Develop geographic expansion plan
- Create knowledge transfer protocols

## Recommendation
**Score: 65/100** - Manageable risks with clear mitigation paths required.`,
    },
    {
      id: "market",
      name: "Market Analysis Agent",
      status: "complete",
      icon: TrendingUp,
      score: 82,
      color: "bg-green-500",
      keyInsights: insights.market,
      fullReport: `# Market Analysis Report

## Executive Summary
The market analysis reveals a compelling opportunity in a high-growth sector. The company is well-positioned to capture significant market share with differentiated offerings.

## Market Overview
- **Total Addressable Market (TAM)**: $12B
- **Serviceable Addressable Market (SAM)**: $4.5B
- **Market Growth Rate**: 15% CAGR
- **Current Market Share**: 2.3%

## Competitive Landscape

### Competitive Advantages
1. **Technology Differentiation**
   - Proprietary algorithms provide 30% efficiency gains
   - Patent portfolio protecting core innovations
   - First-mover advantage in emerging segment

2. **Market Position**
   - Strong brand recognition in mid-market
   - High customer satisfaction scores (NPS: 67)
   - Strategic partnerships with key distributors

### Competitive Threats
1. Well-funded competitors entering space
2. Potential for market consolidation
3. Technology commoditization risk

## Growth Opportunities
- **Adjacent Verticals**: $2B opportunity
- **Geographic Expansion**: 3 target markets identified
- **Product Extensions**: 2 validated use cases

## Market Trends
1. Increasing regulatory requirements favor established players
2. Shift to consumption-based pricing models
3. Growing demand for integration capabilities

## Recommendation
**Score: 82/100** - Strong market position with multiple growth vectors.`,
    },
    {
      id: "compliance",
      name: "Compliance Agent",
      status: "complete",
      icon: CheckCircle,
      score: 90,
      color: "bg-emerald-500",
      keyInsights: insights.compliance,
      fullReport: `# Compliance Assessment Report

## Executive Summary
The compliance review demonstrates a mature approach to regulatory requirements and corporate governance. All key areas meet or exceed industry standards.

## Regulatory Compliance

### Current Status
- ✅ All regulatory filings current and complete
- ✅ No material legal issues or pending litigation
- ✅ Privacy policies compliant with GDPR, CCPA
- ✅ Industry-specific regulations addressed

### Licenses & Permits
- All required licenses valid and up-to-date
- Operating permits in good standing
- No regulatory sanctions or warnings

## Corporate Governance

### Board Structure
- Independent board with diverse expertise
- Regular board meetings (monthly)
- Active audit and compensation committees
- Clear conflict of interest policies

### Internal Controls
- SOX-compliant financial controls
- Regular internal audits conducted
- Documented policies and procedures
- Whistleblower protection in place

## Data Security & Privacy
- ISO 27001 certified
- Annual security audits completed
- Data breach response plan tested
- Employee security training program

## Intellectual Property
- 12 patents granted, 5 pending
- Trademark portfolio protected
- Employee IP assignment agreements
- No outstanding IP disputes

## Areas for Enhancement
1. Enhanced vendor due diligence process
2. Formalize ESG reporting framework
3. Expand D&O insurance coverage

## Recommendation
**Score: 90/100** - Exemplary compliance and governance framework.`,
    },
    {
      id: "challenger",
      name: "Investment Challenger Agent",
      status: "complete",
      icon: AlertTriangle,
      score: 58,
      color: "bg-red-500",
      keyInsights: insights.challenger,
      fullReport: `# Investment Challenger Report

## Executive Summary
The challenger analysis highlights critical concerns and potential deal-breakers that investors should carefully consider. This adversarial perspective identifies areas where the investment thesis may be weak.

## Valuation Concerns

### Current Valuation Analysis
- **Current Valuation**: $45M post-money
- **Revenue Multiple**: 8.5x (industry average: 5-6x)
- **Premium Justification**: Questionable given stage
- **Comparable Analysis**: Trading at 40% premium to peers

### Valuation Risks
1. Market correction could significantly impact exit multiples
2. Growth assumptions may be overly optimistic
3. Limited comparable exit data in this segment

## Scalability Challenges

### International Expansion Concerns
1. **Market Validation** (Critical)
   - No proven demand in target markets
   - Cultural and regulatory barriers underestimated
   - Resource requirements for expansion unclear

2. **Operational Complexity** (High)
   - Infrastructure not designed for multi-region operations
   - Compliance costs in new markets not fully quantified
   - Local competition better positioned

## Team & Execution Risks

### Leadership Gaps
- Limited international business experience
- No proven track record of scaling beyond current size
- Key hires needed in critical areas (CFO, VP International)

### Execution Challenges
- Aggressive growth targets may strain resources
- Product roadmap heavily dependent on unproven technology
- Customer success metrics showing early warning signs

## Competitive Threats

### Market Dynamics
1. Well-funded competitors with deeper pockets entering space
2. Potential for price wars as market matures
3. Technology advantage may be temporary

### Defensive Moat Analysis
- Patent portfolio provides limited protection
- Low switching costs for customers
- Network effects not yet established

## Financial Sustainability

### Burn Rate Concerns
- Current burn rate of $500K/month unsustainable
- Path to profitability unclear beyond projections
- Heavy dependency on continued funding rounds

### Revenue Quality
- High churn rate in certain customer segments
- One-time revenues masking recurring revenue challenges
- Payment terms creating cash flow pressure

## Alternative Scenarios

### Downside Cases
1. **Bear Case**: Valuation cut by 50% if growth targets missed
2. **Competition Case**: Market share erosion to 1.5% from 2.3%
3. **Execution Case**: 18-month delay in international expansion

## Red Flags
⚠️ Aggressive revenue projections not supported by pipeline
⚠️ Customer acquisition costs trending in wrong direction
⚠️ Management team lacks diversity of experience
⚠️ Limited contingency planning for adverse scenarios

## Recommendation
**Score: 58/100** - Significant concerns warrant reduced investment size or pass.`,
    },
    {
      id: "supporter",
      name: "Investment Supporter Agent",
      status: "complete",
      icon: CheckCircle,
      score: 85,
      color: "bg-green-600",
      keyInsights: insights.supporter,
      fullReport: `# Investment Supporter Report

## Executive Summary
The supporter analysis identifies compelling reasons to invest and highlights the opportunity's significant upside potential. This optimistic perspective showcases the investment's strongest attributes.

## Market Opportunity

### Compelling Market Dynamics
- **TAM Growth**: Market growing at 15% CAGR, faster than broader economy
- **Timing**: Early-stage market with significant white space
- **Trends**: Multiple macro trends supporting adoption
- **Urgency**: Window of opportunity before market consolidates

### Competitive Positioning
1. **Technology Leadership**
   - Proprietary algorithms provide sustainable advantage
   - 30% efficiency gains verified by third-party analysis
   - 18-month lead over nearest competitor

2. **Market Validation**
   - 200% net revenue retention from existing customers
   - NPS score of 67 (industry average: 45)
   - Multiple Fortune 500 companies in pipeline

## Strong Fundamentals

### Financial Performance
- Revenue growth accelerating (18% → 23% → projected 35%)
- Improving unit economics with scale
- Gross margins expanding (62% → 65%)
- Customer LTV/CAC ratio improving to 4.5x

### Operational Excellence
- Product development velocity increasing
- Customer onboarding time reduced by 40%
- Engineering team productivity metrics strong
- Low employee turnover (8% annually)

## Leadership & Team

### Proven Track Record
1. **CEO Background**
   - Successfully scaled previous company to $50M ARR
   - Deep domain expertise (15+ years)
   - Strong network in target customer segments

2. **Team Quality**
   - VP Engineering from leading tech company
   - Sales leader with enterprise SaaS experience
   - Advisors include industry luminaries

### Execution Capability
- Consistent delivery on roadmap commitments
- Effective capital deployment in previous rounds
- Strong board governance and reporting discipline

## Growth Catalysts

### Near-Term Opportunities
1. **Product Expansion**: 2 validated use cases ready for launch
2. **Geographic Expansion**: Signed distribution partners in 3 countries
3. **Strategic Partnerships**: LOIs with 2 major platform providers
4. **Enterprise Segment**: Moving upmarket with 3 pilot customers

### Long-Term Vision
- Platform strategy could expand TAM to $25B
- Potential for horizontal expansion into adjacent industries
- Data network effects beginning to materialize
- API ecosystem attracting third-party developers

## Differentiated Advantages

### Sustainable Moats
1. **Technology**: Patent portfolio + trade secrets
2. **Data**: Proprietary dataset growing exponentially
3. **Brand**: Category leader in emerging segment
4. **Ecosystem**: Integration partnerships create lock-in

## Risk Mitigation

### Proactive Management
- Diversification strategy reducing customer concentration
- Technology modernization roadmap funded and staffed
- Geographic expansion phased and de-risked
- Strong compliance and governance framework

## Investment Highlights

### Why Now
✓ Inflection point in market adoption
✓ Company scaling efficiently
✓ Valuation attractive relative to growth potential
✓ Strong insider commitment (founders investing alongside)

### Upside Scenarios
1. **Base Case**: 3.5x return in 4-5 years
2. **Success Case**: 7x return with successful expansion
3. **Home Run**: 12x+ if platform vision realized

## Comparative Analysis
- Outperforming 80% of portfolio companies at similar stage
- Better metrics than [Competitor A] at time of their Series B
- Similar trajectory to [Successful Exit] before their breakout

## Recommendation
**Score: 85/100** - Strong investment opportunity with compelling risk/reward profile.`,
    },
    {
      id: "summary",
      name: "Summary Agent",
      status: "complete",
      icon: FileText,
      score: 79,
      color: "bg-purple-500",
      keyInsights: insights.summary,
      fullReport: `# Investment Summary Report

## Executive Overview
After comprehensive analysis across multiple dimensions, this investment opportunity presents a **QUALIFIED RECOMMEND** with an overall score of **79/100**.

## Overall Assessment

### Investment Thesis
TechCo represents a compelling mid-market SaaS opportunity in a growing sector with strong fundamentals, balanced by execution risks and market uncertainties. The company demonstrates solid product-market fit, capable leadership, and attractive market positioning, though valuation and scaling challenges require careful consideration.

## Scoring Breakdown

| Agent | Score | Weight | Weighted Score |
|-------|-------|--------|----------------|
| Financial Analysis | 78 | 20% | 15.6 |
| Risk Assessment | 65 | 20% | 13.0 |
| Market Analysis | 82 | 20% | 16.4 |
| Compliance | 90 | 15% | 13.5 |
| Investment Supporter | 85 | 12.5% | 10.6 |
| Investment Challenger | 58 | 12.5% | 7.3 |
| **Overall Score** | **79** | **100%** | **79.0** |

## Key Strengths

### 1. Market Opportunity (Score: 82)
- Large and growing TAM ($12B, 15% CAGR)
- Strong competitive positioning in mid-market
- Clear product differentiation and IP protection
- Multiple validated growth vectors

### 2. Financial Performance (Score: 78)
- Healthy revenue growth (23% YoY)
- Above-average margins (EBITDA: 18%)
- Improving unit economics at scale
- Adequate cash runway (18 months)

### 3. Compliance & Governance (Score: 90)
- Exemplary regulatory compliance
- Strong corporate governance structure
- Mature risk management processes
- Clean legal and IP standing

### 4. Team & Execution (Score: 85)
- Experienced leadership with relevant background
- Low employee turnover and strong culture
- Consistent roadmap delivery
- Effective capital deployment

## Key Concerns

### 1. Risk Profile (Score: 65)
- High customer concentration (60% in top 3)
- Limited geographic diversification
- Technology infrastructure debt
- Key person dependencies

### 2. Valuation & Returns (Score: 58)
- Premium valuation vs. comparables (8.5x revenue)
- Unproven international scalability
- Execution risks on aggressive growth targets
- Market timing and competitive pressures

## Investment Recommendation

### Recommendation: PROCEED WITH CONDITIONS
**Suggested Investment Size**: $3-5M (medium allocation)
**Suggested Valuation**: $40-42M (negotiate down from $45M)
**Required Conditions**:
1. Board seat and information rights
2. Anti-dilution protection
3. Customer diversification milestones
4. Key hire requirements (CFO, VP International)

## Risk-Adjusted Return Analysis

### Base Case (60% probability)
- Expected Return: 3.2x over 4-5 years
- IRR: ~28%
- Exit: Strategic acquisition or Series C at $140M+

### Success Case (25% probability)
- Expected Return: 6.5x over 4-5 years
- IRR: ~45%
- Exit: IPO or strategic at $280M+

### Downside Case (15% probability)
- Expected Return: 0.8x (partial loss)
- Scenario: Failed expansion, down round, or acqui-hire

### Expected Value: 2.9x return, ~26% IRR

## Strategic Fit

### Portfolio Alignment
✓ Sector focus: Enterprise SaaS
✓ Stage: Growth-stage Series B
✓ Geography: Primary market expansion
✓ Thesis: Vertical SaaS plays in fragmented markets

### Value-Add Opportunities
- Introductions to enterprise customers
- International expansion playbook
- Operational support (finance, HR)
- Follow-on capital for Series C

## Deal Structure Recommendations

### Investment Terms
- **Amount**: $4M participation in $15M round
- **Valuation**: $40M post (negotiate 11% discount)
- **Board**: Observer seat with path to full seat
- **Pro-rata**: Full rights for future rounds

### Key Protections
- 1x non-participating liquidation preference
- Broad-based weighted average anti-dilution
- Standard information rights
- Co-sale and drag-along provisions

## Action Items & Next Steps

### Immediate (Week 1-2)
1. [ ] Schedule management deep-dive sessions
2. [ ] Conduct customer reference calls (5-6 customers)
3. [ ] Engage technical advisor for product review
4. [ ] Request detailed financial model and pipeline data

### Due Diligence (Week 3-4)
1. [ ] Financial and tax review
2. [ ] Legal and IP diligence
3. [ ] Technical architecture assessment
4. [ ] Market and competitive analysis validation

### Negotiation (Week 5-6)
1. [ ] Submit term sheet at $40M valuation
2. [ ] Negotiate governance and information rights
3. [ ] Finalize investment conditions and milestones
4. [ ] Align on post-investment value-add plan

## Comparable Investments

### Similar Portfolio Wins
- **InvestCo A**: Similar stage, 5.2x return in 4 years
- **InvestCo B**: Same sector, successful IPO at 8x

### Portfolio Lessons
- Customer concentration risk materialized in 2 cases
- International expansion timeline typically 1.5x projections
- Technology debt can slow growth if not addressed

## Conclusion

This investment opportunity scores **79/100**, representing a **solid investment** with balanced risk-reward characteristics. The company demonstrates strong fundamentals and promising growth trajectory, while facing manageable but material execution risks.

**Recommended Action**: **PROCEED** with investment at reduced valuation ($40M vs $45M) with appropriate governance and protection terms.

### Investment Committee Recommendation
**APPROVE** for $4M investment subject to:
- Successful reference calls
- Clean financial and legal diligence
- Acceptance of governance terms
- Commitment to customer diversification plan

---
*Report Generated: October 28, 2025*
*Confidence Level: High (85%)*
*Next Review: Post-Investment (90 days)*`,
    },
  ];

  const handleNewAnalysisRun = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmRun = () => {
    // TODO: Implement the logic to create a new analysis run
    console.log("Creating new analysis run:", analysisRunName);
    console.log("Investment hypothesis:", investmentHypothesis);
    setIsDialogOpen(false);
    setAnalysisRunName("");
    setInvestmentHypothesis("");
    setIsAnalysisRunning(true);
    setCompletedAgents([]); // Clear all agent results
    
    // Simulate agents completing one by one
    const agentOrder = ['financial', 'risk', 'market', 'compliance', 'supporter', 'challenger', 'summary'];
    const agentDelay = 1500; // 1.5 seconds between each agent
    
    agentOrder.forEach((agentId, index) => {
      setTimeout(() => {
        setCompletedAgents(prev => [...prev, agentId]);
        
        // Mark analysis as complete when last agent finishes
        if (index === agentOrder.length - 1) {
          setTimeout(() => {
            setIsAnalysisRunning(false);
          }, 500);
        }
      }, agentDelay * (index + 1));
    });
  };

  const handleCancelRun = () => {
    setIsDialogOpen(false);
    setAnalysisRunName("");
    setInvestmentHypothesis("");
  };

  const handleExpandAgent = (agentId: string) => {
    setSelectedAgentDetail(agentId);
    setIsAgentDetailOpen(true);
    setIsCopied(false);
  };

  const handleCopyToClipboard = async () => {
    if (selectedAgent) {
      try {
        await navigator.clipboard.writeText(selectedAgent.fullReport);
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "The full report has been copied to your clipboard.",
        });
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const selectedAgent = agents.find(agent => agent.id === selectedAgentDetail);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Investment Opportunity
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {opportunityName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Multi-agent AI analysis results
              </p>
            </div>
          </div>
        </div>

        {/* Document Processing Status */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Documents
              </h3>
              {hasDocuments && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs h-5">
                    {documents.total} Total
                  </Badge>
                  {allDocumentsProcessed ? (
                    <Badge className="bg-green-500 text-xs h-5">
                      <CheckCircle className="h-2.5 w-2.5 mr-1" />
                      All Processed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs h-5">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {documents.completed}/{documents.total} Processed
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/process-documents")}
              className="h-8"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              <span className="text-xs">Manage</span>
            </Button>
          </div>

          {!hasDocuments ? (
            <Alert className="py-2">
              <FileX className="h-3.5 w-3.5" />
              <AlertTitle className="text-sm mb-0">No Documents</AlertTitle>
              <AlertDescription className="text-xs">
                Upload documents to begin analysis.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <Progress value={processingProgress} className="h-1.5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground min-w-[3rem] text-right">
                  {processingProgress}%
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                <div className="text-center py-1.5 px-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">{documents.completed}</div>
                  <div className="text-[10px] text-green-600 dark:text-green-500">Done</div>
                </div>
                <div className="text-center py-1.5 px-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{documents.processing}</div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-500">Active</div>
                </div>
                <div className="text-center py-1.5 px-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{documents.pending}</div>
                  <div className="text-[10px] text-yellow-600 dark:text-yellow-500">Queue</div>
                </div>
                <div className="text-center py-1.5 px-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                  <div className="text-lg font-bold text-red-700 dark:text-red-400">{documents.error}</div>
                  <div className="text-[10px] text-red-600 dark:text-red-500">Error</div>
                </div>
                <div className="text-center py-1.5 px-2 bg-muted/50 border border-border rounded">
                  <div className="text-lg font-bold text-foreground">{documents.total}</div>
                  <div className="text-[10px] text-muted-foreground">Total</div>
                </div>
              </div>
            </>
          )}
        </Card>

        {!allDocumentsProcessed ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-muted rounded-full">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Documents Processing Required
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Process all opportunity documents to enable AI analysis.
                </p>
              </div>
              <Button
                onClick={() => navigate("/process-documents")}
                className="gap-2"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                Go to Process Documents
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Analysis Run
              </label>
              <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an analysis run" />
                </SelectTrigger>
                <SelectContent>
                  {analysisRuns.map((run) => (
                    <SelectItem key={run.id} value={run.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{run.name}</span>
                        <span className="ml-4 text-xs text-muted-foreground">
                          {run.date} • Score: {run.overallScore}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Button 
                className="bg-primary hover:bg-primary/90 mt-6"
                onClick={handleNewAnalysisRun}
              >
                <Play className="mr-2 h-4 w-4" />
                New Analysis Run
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className={isAnalysisRunning ? "lg:col-span-1" : "lg:col-span-2"}>
            <Card className="p-6 h-full">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                AI Agent Results
              </h2>
              
              {isAnalysisRunning && completedAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Initializing AI agents...</p>
                </div>
              )}
              
              {/* Core Analysis Agents */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Core Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {agents.filter(agent => ['financial', 'risk', 'market', 'compliance'].includes(agent.id) && completedAgents.includes(agent.id)).map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div
                        key={agent.id}
                        className="p-3 border border-border rounded-lg hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div className={`${agent.color} p-1.5 rounded-lg flex-shrink-0`}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs text-foreground leading-tight">
                                {agent.name}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-lg font-bold text-foreground leading-none">
                              {agent.score}
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <ul className="space-y-0.5">
                            {agent.keyInsights.map((insight, index) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-start leading-tight">
                                <span className="mr-1 flex-shrink-0">•</span>
                                <span className="flex-1">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleExpandAgent(agent.id)}
                            className="text-xs h-6 px-2"
                          >
                            <Expand className="mr-1 h-2.5 w-2.5" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Perspective Agents */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Investment Perspectives</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {agents.filter(agent => ['supporter', 'challenger'].includes(agent.id) && completedAgents.includes(agent.id)).map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div
                        key={agent.id}
                        className="p-3 border border-border rounded-lg hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div className={`${agent.color} p-1.5 rounded-lg flex-shrink-0`}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs text-foreground leading-tight">
                                {agent.name}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-lg font-bold text-foreground leading-none">
                              {agent.score}
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <ul className="space-y-0.5">
                            {agent.keyInsights.map((insight, index) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-start leading-tight">
                                <span className="mr-1 flex-shrink-0">•</span>
                                <span className="flex-1">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleExpandAgent(agent.id)}
                            className="text-xs h-6 px-2"
                          >
                            <Expand className="mr-1 h-2.5 w-2.5" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Agent */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Overall Recommendation</h3>
                <div className="grid grid-cols-1 gap-3">
                  {agents.filter(agent => agent.id === 'summary' && completedAgents.includes(agent.id)).map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div
                        key={agent.id}
                        className="p-3 border border-border rounded-lg hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div className={`${agent.color} p-1.5 rounded-lg flex-shrink-0`}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs text-foreground leading-tight">
                                {agent.name}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-lg font-bold text-foreground leading-none">
                              {agent.score}
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <ul className="space-y-0.5">
                            {agent.keyInsights.map((insight, index) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-start leading-tight">
                                <span className="mr-1 flex-shrink-0">•</span>
                                <span className="flex-1">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleExpandAgent(agent.id)}
                            className="text-xs h-6 px-2"
                          >
                            <Expand className="mr-1 h-2.5 w-2.5" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          <div className={isAnalysisRunning ? "lg:col-span-2" : "lg:col-span-1"}>
            <Card className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                AI Agent Workflow
              </h2>
              <div className="flex-1 h-full overflow-auto">
                <AgentWorkflow />
              </div>
            </Card>
          </div>
        </div>

        {/* What If Analysis Section */}
        <div className="mb-6">
          <ChatInterface />
        </div>
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Analysis Run</DialogTitle>
            <DialogDescription>
              Enter a name for the new analysis run and provide guidance for the AI agents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="analysis-name">Analysis Run Name</Label>
              <Input
                id="analysis-name"
                placeholder="e.g., TechCo Series B Analysis"
                value={analysisRunName}
                onChange={(e) => setAnalysisRunName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="investment-hypothesis">Investment Hypothesis (Optional)</Label>
              <Textarea
                id="investment-hypothesis"
                placeholder="Describe your investment hypothesis, key assumptions, or specific areas you'd like the AI agents to focus on..."
                value={investmentHypothesis}
                onChange={(e) => setInvestmentHypothesis(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This information will guide the AI agents during their analysis.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelRun}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRun}
              disabled={!analysisRunName.trim()}
            >
              Confirm Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgentDetailOpen} onOpenChange={setIsAgentDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent && (
                <>
                  <div className={`${selectedAgent.color} p-2 rounded-lg`}>
                    <selectedAgent.icon className="h-4 w-4 text-white" />
                  </div>
                  {selectedAgent.name}
                </>
              )}
            </DialogTitle>
            <div className="flex items-center justify-between">
              <DialogDescription>
                Complete analysis report and findings
              </DialogDescription>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleCopyToClipboard}
                title={isCopied ? "Copied!" : "Copy to clipboard"}
                className="h-8 w-8"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {selectedAgent && (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {selectedAgent.fullReport}
                </pre>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAgentDetailOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analysis;