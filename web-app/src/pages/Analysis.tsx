import { useState, useEffect } from "react";
import { ArrowLeft, Brain, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Play, Clock, FileText, Expand, Copy, Check, FileCheck, FileX, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";
import Header from "@/components/Header";
import { AnalysisProcessingWorkflow } from "@/components/AnalysisProcessingWorkflow";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as analysisApi from "@/lib/api/analysis";
import * as opportunitiesApi from "@/lib/api/opportunities";
import * as documentsApi from "@/lib/api/documents";
import type { Analysis as AnalysisType, Opportunity, ProcessingStatistics } from "@/lib/api/types";

const Analysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const opportunityId = searchParams.get("opid") || "";
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisType[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStatistics | null>(null);
  
  // UI states
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [isNewRunDialogOpen, setIsNewRunDialogOpen] = useState(false);
  const [analysisRunName, setAnalysisRunName] = useState("");
  const [investmentHypothesis, setInvestmentHypothesis] = useState("");
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [isCreatingAnalysis, setIsCreatingAnalysis] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!opportunityId) {
        setError("No opportunity ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch opportunity details, analyses, and processing statistics in parallel
        const [opportunityData, analysesData, docProcessingStatsData] = await Promise.all([
          opportunitiesApi.getOpportunity(opportunityId),
          analysisApi.getAnalysesByOpportunity(opportunityId),
          documentsApi.getProcessingStatistics(opportunityId).catch(() => null), // Gracefully handle if no documents
        ]);

        setOpportunity(opportunityData);
        setAnalyses(analysesData);
        setProcessingStats(docProcessingStatsData);

        // Set the first analysis as selected by default
        if (analysesData.length > 0 && !selectedRunId) {
          setSelectedRunId(analysesData[0].id);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load analysis data");
        toast({
          title: "Error",
          description: "Failed to load analysis data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [opportunityId]);

  const opportunityName = opportunity?.display_name || "Investment Opportunity";

  // Document processing status - use API data if available, otherwise show empty state
  const documents = processingStats ? {
    total: processingStats.total_documents,
    pending: processingStats.pending,
    processing: processingStats.in_progress,
    completed: processingStats.completed,
    error: processingStats.failed,
  } : {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    error: 0,
  };

  const allDocumentsProcessed = documents.completed === documents.total && documents.total > 0;
  const hasDocuments = documents.total > 0;
  const processingProgress = hasDocuments ? Math.round((documents.completed / documents.total) * 100) : 0;

  // Transform API analyses to the format expected by the UI
  const analysisRuns = analyses.map(analysis => ({
    id: analysis.id,
    name: analysis.name,
    date: new Date(analysis.created_at).toISOString().split('T')[0],
    time: new Date(analysis.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: analysis.status,
  }));

  const handleNewAnalysisRun = () => {
    setIsNewRunDialogOpen(true);
  };

  const handleConfirmRun = async () => {
    if (!opportunityId || !analysisRunName.trim()) {
      return;
    }

    try {
      setIsCreatingAnalysis(true);
      
      // Create the analysis via API
      const newAnalysis = await analysisApi.createAnalysis({
        name: analysisRunName,
        opportunity_id: opportunityId,
        investment_hypothesis: investmentHypothesis || undefined,
        tags: [],
      });

      // Add the new analysis to the list
      setAnalyses([newAnalysis, ...analyses]);
      setSelectedRunId(newAnalysis.id);

      toast({
        title: "Analysis Created",
        description: `"${analysisRunName}" has been created successfully.`,
      });

      // Close dialog and reset form
      setIsNewRunDialogOpen(false);
      setAnalysisRunName("");
      setInvestmentHypothesis("");

      // Start the analysis
      const startedAnalysis = await analysisApi.startAnalysis(opportunityId, newAnalysis.id);
      
      // Update the analysis status in the list
      setAnalyses(prev => prev.map(a => 
        a.id === startedAnalysis.id ? { ...a, status: startedAnalysis.status } : a
      ));

      setIsAnalysisRunning(true);
      
    } catch (err: any) {
      console.error("Error creating or starting analysis:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAnalysis(false);
      setIsAnalysisRunning(false);
    }
  };

  const handleAnalysisWorkflowComplete = (status: string, data: any) => {
    setIsAnalysisRunning(false);
    
    // Update the analysis status when complete
    setAnalyses(prev => prev.map(a => 
      a.id === selectedRunId ? { ...a, status: status as AnalysisType['status'] } : a
    ));
  };

  const handleCancelRun = () => {
    setIsNewRunDialogOpen(false);
    setAnalysisRunName("");
    setInvestmentHypothesis("");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading analysis data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !opportunityId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {error || "No Opportunity Selected"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {error ? "Please try again and check that the API is running." : "Please select an opportunity from the dashboard."}
                </p>
              </div>
              <Button onClick={() => navigate("/")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

        {/* Two Column Grid: Analysis Run Selector and Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Analysis Run Selector - Left Column */}
          {analysisRuns.length > 0 && (
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Analysis Run
                  </h3>
                  <Button 
                    size="sm"
                    onClick={handleNewAnalysisRun}
                    disabled={isAnalysisRunning || isCreatingAnalysis}
                    className="h-7 text-xs"
                  >
                    <Play className="mr-1 h-3 w-3" />
                    New Run
                  </Button>
                </div>
                <Select value={selectedRunId} onValueChange={setSelectedRunId} disabled={isAnalysisRunning || isCreatingAnalysis}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select an analysis run" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisRuns.map((run) => (
                      <SelectItem key={run.id} value={run.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{run.name}</span>
                          <span className="ml-4 text-xs text-muted-foreground">
                            {run.date} - {run.time} - {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          )}

          {/* Document Processing Status - Right Column */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Documents
                </h3>
                {hasDocuments && (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs h-5">
                      {documents.total} Total
                    </Badge>
                    {allDocumentsProcessed ? (
                      <Badge className="bg-green-500 text-xs h-5">
                        <CheckCircle className="h-2.5 w-2.5 mr-1" />
                        Done
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs h-5">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {documents.completed}/{documents.total}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/process-documents?opportunityId=${opportunityId}`)}
                className="h-7 text-xs"
              >
                <FileText className="mr-1 h-3 w-3" />
                Manage
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

                <div className="grid grid-cols-5 gap-1.5">
                  <div className="text-center py-1.5 px-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                    <div className="text-base font-bold text-green-700 dark:text-green-400">{documents.completed}</div>
                    <div className="text-[9px] text-green-600 dark:text-green-500">Done</div>
                  </div>
                  <div className="text-center py-1.5 px-1 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="text-base font-bold text-blue-700 dark:text-blue-400">{documents.processing}</div>
                    <div className="text-[9px] text-blue-600 dark:text-blue-500">Active</div>
                  </div>
                  <div className="text-center py-1.5 px-1 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <div className="text-base font-bold text-yellow-700 dark:text-yellow-400">{documents.pending}</div>
                    <div className="text-[9px] text-yellow-600 dark:text-yellow-500">Queue</div>
                  </div>
                  <div className="text-center py-1.5 px-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="text-base font-bold text-red-700 dark:text-red-400">{documents.error}</div>
                    <div className="text-[9px] text-red-600 dark:text-red-500">Error</div>
                  </div>
                  <div className="text-center py-1.5 px-1 bg-muted/50 border border-border rounded">
                    <div className="text-base font-bold text-foreground">{documents.total}</div>
                    <div className="text-[9px] text-muted-foreground">Total</div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

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
                onClick={() => navigate(`/process-documents?opportunityId=${opportunityId}`)}
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
            {analysisRuns.length === 0 ? (
              <Card className="p-8 mb-6">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <Brain className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      No Analysis Runs Yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Create your first AI-powered investment analysis run to get started.
                    </p>
                  </div>
                  <Button
                    onClick={handleNewAnalysisRun}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    New Analysis Run
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {/* Analysis with Real-Time Events */}
                {selectedRunId && (
                  <AnalysisProcessingWorkflow
                    opportunityId={opportunityId}
                    analysisId={selectedRunId}
                    analysisStatus={analyses.find(a => a.id === selectedRunId)?.status}
                    onComplete={(status, data) => {
                      handleAnalysisWorkflowComplete(status, data);
                    }}
                  />
                )}

                {/* What If Analysis Section */}
                {/* Only show if status of workflow is completed */}
                {analyses.find(a => a.id === selectedRunId)?.status === 'completed' && (
                  <div className="mt-6 mb-6">
                    <ChatInterface />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={isNewRunDialogOpen} onOpenChange={setIsNewRunDialogOpen}>
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
              disabled={isCreatingAnalysis}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRun}
              disabled={!analysisRunName.trim() || isCreatingAnalysis}
            >
              {isCreatingAnalysis ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Confirm Run"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  );
};

export default Analysis;