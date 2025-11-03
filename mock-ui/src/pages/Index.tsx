import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  ArrowRight,
  Search,
  Pencil,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Opportunity {
  id: string;
  name: string;
  company: string;
  stage: string;
  amount: string;
  date: string;
  score: number;
  status: "active" | "reviewing" | "completed";
  documentsCount: number;
  description: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for existing opportunities
  const opportunities: Opportunity[] = [
    {
      id: "1",
      name: "SaaS Platform Expansion",
      company: "TechCo Solutions",
      stage: "Series B",
      amount: "$15M",
      date: "2025-10-15",
      score: 79,
      status: "completed",
      documentsCount: 12,
      description: "Enterprise SaaS platform for project management",
    },
    {
      id: "2",
      name: "Green Energy Initiative",
      company: "EcoPower Inc",
      stage: "Series A",
      amount: "$8M",
      date: "2025-10-20",
      score: 85,
      status: "reviewing",
      documentsCount: 8,
      description: "Renewable energy solutions for commercial buildings",
    },
    {
      id: "3",
      name: "Healthcare AI Platform",
      company: "MediTech AI",
      stage: "Seed",
      amount: "$3.5M",
      date: "2025-10-25",
      score: 72,
      status: "active",
      documentsCount: 6,
      description: "AI-powered diagnostic assistance platform",
    },
  ];

  const filteredOpportunities = opportunities.filter(
    (opp) =>
      opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "reviewing":
        return "bg-blue-500";
      case "active":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Investment Opportunities
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and analyze your investment opportunities
            </p>
          </div>
          <Button
            onClick={() => navigate("/opportunity/new")}
            className="mt-4 md:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Opportunity
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Opportunities
              </h3>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {opportunities.length}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Active Reviews
              </h3>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {opportunities.filter((o) => o.status === "reviewing").length}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Value
              </h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground">$26.5M</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Avg. Score
              </h3>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(
                opportunities.reduce((sum, o) => sum + o.score, 0) /
                  opportunities.length
              )}
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opportunities by name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {filteredOpportunities.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No opportunities found</p>
            </Card>
          ) : (
            filteredOpportunities.map((opportunity) => (
              <Card
                key={opportunity.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/analysis?id=${opportunity.id}`)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {opportunity.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(
                              opportunity.status
                            )} text-white border-0`}
                          >
                            {opportunity.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          {opportunity.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              {opportunity.company}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {opportunity.stage}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {opportunity.amount}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {new Date(opportunity.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {opportunity.documentsCount} documents
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 lg:ml-6 mt-4 lg:mt-0">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        AI Score
                      </div>
                      <div
                        className={`text-3xl font-bold ${getScoreColor(
                          opportunity.score
                        )}`}
                      >
                        {opportunity.score}
                      </div>
                      <div className="text-xs text-muted-foreground">/100</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/opportunity/edit?id=${opportunity.id}`);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View Analysis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Empty State */}
        {opportunities.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              No Investment Opportunities
            </h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first investment opportunity
            </p>
            <Button onClick={() => navigate("/opportunity/new")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create New Opportunity
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
