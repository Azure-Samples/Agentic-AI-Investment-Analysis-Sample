import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  ArrowRight,
  Search,
  Pencil,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { opportunities, documents } from "@/lib/api";
import type { Opportunity as APIOpportunity } from "@/lib/api/types";

interface OpportunityWithDocs extends APIOpportunity {
  documentsCount: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [opportunitiesList, setOpportunitiesList] = useState<OpportunityWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch opportunities and their document counts
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all active opportunities
        const opps = await opportunities.getOpportunities(true);
        
        // Fetch document count for each opportunity
        const oppsWithDocs = await Promise.all(
          opps.map(async (opp) => {
            try {
              const docs = await documents.getDocuments(opp.id);
              return {
                ...opp,
                documentsCount: docs.length,
              };
            } catch (err) {
              console.error(`Error fetching documents for opportunity ${opp.id}:`, err);
              return {
                ...opp,
                documentsCount: 0,
              };
            }
          })
        );
        
        setOpportunitiesList(oppsWithDocs);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunitiesList.filter(
    (opp) =>
      opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (tags: string[]) => {
    // Determine status based on tags or other criteria
    if (tags.includes("completed")) return "bg-green-500";
    if (tags.includes("reviewing") || tags.includes("in_progress")) return "bg-blue-500";
    if (tags.includes("active")) return "bg-orange-500";
    return "bg-gray-500";
  };

  const getStatusLabel = (tags: string[]) => {
    if (tags.includes("completed")) return "completed";
    if (tags.includes("reviewing") || tags.includes("in_progress")) return "reviewing";
    if (tags.includes("active")) return "active";
    return "pending";
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading opportunities...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error loading opportunities</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Content - Only show when not loading */}
        {!loading && !error && (
          <>
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
                <Card className="p-12 text-center mb-4">
                  <p className="text-muted-foreground">No opportunities found</p>
                </Card>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <Card
                    key={opportunity.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/analysis?opid=${opportunity.id}`)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-foreground">
                                {opportunity.display_name || opportunity.name}
                              </h3>
                            </div>
                            <p className="text-muted-foreground mb-3">
                              {opportunity.description}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              {opportunity.settings?.company && (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">
                                    {opportunity.settings.company}
                                  </span>
                                </div>
                              )}
                              {opportunity.settings?.stage && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {opportunity.settings.stage}
                                  </Badge>
                                </div>
                              )}
                              {opportunity.settings?.industry && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {opportunity.settings.industry}
                                  </Badge>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {new Date(opportunity.created_at).toLocaleDateString()}
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
            {opportunitiesList.length === 0 && (
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
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
