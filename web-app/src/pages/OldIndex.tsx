import { useState } from "react";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import AgentWorkflow from "@/components/AgentWorkflow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Brain, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const agents = [
    {
      id: "financial",
      name: "Financial Analysis Agent",
      status: "complete",
      icon: BarChart3,
      score: 78,
      color: "bg-blue-500",
    },
    {
      id: "risk",
      name: "Risk Assessment Agent",
      status: "complete",
      icon: AlertTriangle,
      score: 65,
      color: "bg-orange-500",
    },
    {
      id: "market",
      name: "Market Analysis Agent",
      status: "complete",
      icon: TrendingUp,
      score: 82,
      color: "bg-green-500",
    },
    {
      id: "compliance",
      name: "Compliance Agent",
      status: "complete",
      icon: CheckCircle,
      score: 90,
      color: "bg-emerald-500",
    },
  ];

  const insights = {
    financial: [
      "Revenue growth of 23% YoY demonstrates strong market traction",
      "EBITDA margin of 18% is above industry average",
      "Cash runway of 18 months provides adequate buffer",
    ],
    risk: [
      "High customer concentration risk - top 3 clients represent 60% of revenue",
      "Limited geographic diversification may impact growth",
      "Technology infrastructure requires modernization investment",
    ],
    market: [
      "Total addressable market estimated at $12B with 15% CAGR",
      "Competitive positioning is strong in mid-market segment",
      "Expansion into adjacent verticals shows promising early indicators",
    ],
    compliance: [
      "All regulatory filings are current and complete",
      "No material legal issues or pending litigation",
      "Corporate governance structure meets institutional standards",
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              AI Investment Analysis
            </h1>
            <p className="text-sm text-muted-foreground">
              Multi-agent analysis results for investment opportunity
            </p>
          </div>
          <Button onClick={() => navigate("/upload")}>
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Overall Score</h3>
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="text-4xl font-bold text-foreground mb-2">79/100</div>
            <Progress value={79} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Strong investment opportunity with moderate risk
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Documents Analyzed</h3>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-4xl font-bold text-foreground mb-2">12</div>
            <p className="text-sm text-muted-foreground">
              Financial statements, market reports, and legal docs
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Analysis Time</h3>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-4xl font-bold text-foreground mb-2">3.2s</div>
            <p className="text-sm text-muted-foreground">
              AI agents completed comprehensive analysis
            </p>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            AI Agent Workflow
          </h2>
          <AgentWorkflow />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              AI Agent Results
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {agents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <div
                    key={agent.id}
                    className="p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => setActiveAgent(agent.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`${agent.color} p-2 rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {agent.name}
                          </h3>
                          <Badge variant="outline" className="mt-1">
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {agent.score}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                    <Progress value={agent.score} className="mb-2" />
                  </div>
                );
              })}
            </div>
          </Card>

          <ChatInterface />
        </div>

        <Card className="p-6">
          <Tabs defaultValue="financial" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            {Object.entries(insights).map(([key, items]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  Key Insights
                </h3>
                <div className="space-y-3">
                  {items.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-accent rounded-lg"
                    >
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-foreground">{insight}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;
