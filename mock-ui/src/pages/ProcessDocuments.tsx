import { useState, useEffect } from "react";
import { FileText, Play, CheckCircle2, Clock, AlertCircle, Building2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import DocumentProcessingWorkflow from "@/components/DocumentProcessingWorkflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient, type Opportunity as ApiOpportunity, type Document as ApiDocument } from "@/lib/api-client";

export type ProcessingStatus = "pending" | "processing" | "completed" | "error";

export interface Document {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: ProcessingStatus;
  progress?: number;
  opportunityId: string;
}

export interface Opportunity {
  id: string;
  name: string;
  company: string;
  sector: string;
  documentCount: number;
  pendingCount: number;
  completedCount: number;
}

const ProcessDocuments = () => {
  const { toast } = useToast();
  
  // State for API data
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [currentProcessingDoc, setCurrentProcessingDoc] = useState<Document | null>(null);

  // Fetch opportunities and documents from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all opportunities
        const oppsData = await apiClient.getOpportunities();
        
        // Fetch documents for each opportunity
        const opportunitiesWithDocs = await Promise.all(
          oppsData.map(async (opp) => {
            try {
              const docs = await apiClient.getOpportunityDocuments(opp.id);
              const settings = opp.settings as Record<string, unknown> || {};
              
              // Transform documents to UI format
              const transformedDocs: Document[] = docs.map(doc => ({
                id: doc.id,
                name: doc.name,
                size: formatFileSize(doc.size),
                uploadDate: new Date(doc.uploaded_at).toISOString().split('T')[0],
                status: doc.processing_status as ProcessingStatus,
                progress: doc.processing_progress,
                opportunityId: opp.id,
              }));
              
              // Calculate document counts
              const pendingCount = docs.filter(d => d.processing_status === 'pending').length;
              const completedCount = docs.filter(d => d.processing_status === 'completed').length;
              
              return {
                id: opp.id,
                name: opp.display_name,
                company: (settings.company as string) || "Unknown Company",
                sector: (settings.industry as string) || "Unknown Sector",
                documentCount: docs.length,
                pendingCount,
                completedCount,
              };
            } catch (error) {
              console.error(`Failed to fetch documents for opportunity ${opp.id}:`, error);
              return null;
            }
          })
        );
        
        // Filter out null values and set opportunities
        const validOpportunities = opportunitiesWithDocs.filter((opp): opp is Opportunity => opp !== null);
        setOpportunities(validOpportunities);
        
        // Fetch and combine all documents
        const allDocsArrays = await Promise.all(
          oppsData.map(async (opp) => {
            try {
              const docs = await apiClient.getOpportunityDocuments(opp.id);
              return docs.map(doc => ({
                id: doc.id,
                name: doc.name,
                size: formatFileSize(doc.size),
                uploadDate: new Date(doc.uploaded_at).toISOString().split('T')[0],
                status: doc.processing_status as ProcessingStatus,
                progress: doc.processing_progress,
                opportunityId: opp.id,
              }));
            } catch (error) {
              console.error(`Failed to fetch documents for opportunity ${opp.id}:`, error);
              return [];
            }
          })
        );
        
        setAllDocuments(allDocsArrays.flat());
        
      } catch (error) {
        console.error("Failed to fetch opportunities and documents:", error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Failed to load opportunities and documents",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Filter documents by selected opportunity
  const documents = selectedOpportunity
    ? allDocuments.filter(doc => doc.opportunityId === selectedOpportunity)
    : [];
  
  const selectedOpportunityData = opportunities.find(opp => opp.id === selectedOpportunity);

  const toggleDocumentSelection = (docId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocuments(newSelection);
  };

  const selectAll = () => {
    const pendingDocs = documents.filter(doc => doc.status === "pending");
    setSelectedDocuments(new Set(pendingDocs.map(doc => doc.id)));
  };

  const deselectAll = () => {
    setSelectedDocuments(new Set());
  };

  const handleProcessDocuments = async () => {
    if (selectedDocuments.size === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to process",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOpportunity) {
      toast({
        title: "No opportunity selected",
        description: "Please select an opportunity first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Start processing via API
      const documentIds = Array.from(selectedDocuments);
      await apiClient.processDocuments(selectedOpportunity, documentIds);

      // Show processing dialog
      setIsProcessingDialogOpen(true);
      processNextDocument();

      toast({
        title: "Processing started",
        description: "Documents are being processed by AI agents",
      });
    } catch (error) {
      console.error("Failed to start document processing:", error);
      toast({
        variant: "destructive",
        title: "Error starting processing",
        description: error instanceof Error ? error.message : "Failed to start document processing",
      });
    }
  };

  const processNextDocument = () => {
    const selectedDocsArray = Array.from(selectedDocuments);
    const currentIndex = documents.findIndex(
      doc => doc.id === currentProcessingDoc?.id
    );

    let nextDocId: string | null = null;

    if (currentProcessingDoc === null) {
      // Start with first document
      nextDocId = selectedDocsArray[0];
    } else {
      // Find next document to process
      const currentDocIndex = selectedDocsArray.indexOf(currentProcessingDoc.id);
      if (currentDocIndex < selectedDocsArray.length - 1) {
        nextDocId = selectedDocsArray[currentDocIndex + 1];
      }
    }

    if (nextDocId) {
      const docToProcess = documents.find(doc => doc.id === nextDocId);
      if (docToProcess) {
        setCurrentProcessingDoc(docToProcess);
        
        // Update document status to processing
        setAllDocuments(prev =>
          prev.map(doc =>
            doc.id === nextDocId
              ? { ...doc, status: "processing" as ProcessingStatus, progress: 0 }
              : doc
          )
        );

        // Simulate processing with progress
        simulateProcessing(docToProcess);
      }
    } else {
      // All documents processed
      setTimeout(() => {
        setIsProcessingDialogOpen(false);
        setCurrentProcessingDoc(null);
        setSelectedDocuments(new Set());
        toast({
          title: "Processing complete",
          description: `Successfully processed ${selectedDocsArray.length} document(s)`,
        });
      }, 1000);
    }
  };

  const simulateProcessing = (doc: Document) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAllDocuments(prev =>
        prev.map(d =>
          d.id === doc.id ? { ...d, progress } : d
        )
      );

      if (progress >= 100) {
        clearInterval(interval);
        // Mark as completed
        setAllDocuments(prev =>
          prev.map(d =>
            d.id === doc.id
              ? { ...d, status: "completed" as ProcessingStatus, progress: 100 }
              : d
          )
        );
        // Process next document after a short delay
        setTimeout(() => {
          processNextDocument();
        }, 800);
      }
    }, 400);
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <AlertCircle className="h-3 w-3" />
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
    }
  };

  const pendingCount = documents.filter(doc => doc.status === "pending").length;
  const completedCount = documents.filter(doc => doc.status === "completed").length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Process Documents
            </h1>
            <p className="text-sm text-muted-foreground">
              Select an opportunity to view and process its documents with AI-powered agents
            </p>
          </div>

          {/* Opportunity Selection */}
          {!selectedOpportunity ? (
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  Select an Opportunity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {opportunities.map((opp) => (
                    <Card
                      key={opp.id}
                      className="p-4 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedOpportunity(opp.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground mb-1 truncate">
                            {opp.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {opp.company}
                          </p>
                          <Badge variant="outline" className="mb-3">
                            {opp.sector}
                          </Badge>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Total</div>
                              <div className="font-semibold">{opp.documentCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Pending</div>
                              <div className="font-semibold text-yellow-600">
                                {opp.pendingCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Done</div>
                              <div className="font-semibold text-green-600">
                                {opp.completedCount}
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <>
              {/* Selected Opportunity Header */}
              <Card className="p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {selectedOpportunityData?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedOpportunityData?.company} • {selectedOpportunityData?.sector}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOpportunity(null);
                      setSelectedDocuments(new Set());
                    }}
                  >
                    Change Opportunity
                  </Button>
                </div>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Documents</div>
                  <div className="text-2xl font-bold">{documents.length}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                </Card>
              </div>

              {/* Action Bar */}
              <Card className="p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      disabled={pendingCount === 0}
                    >
                      Select All Pending
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedDocuments.size} selected
                    </span>
                  </div>
                  <Button
                    onClick={handleProcessDocuments}
                    disabled={selectedDocuments.size === 0}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Process Selected ({selectedDocuments.size})
                  </Button>
                </div>
              </Card>

              {/* Documents List */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  Documents
                </h3>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents found for this opportunity
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                          selectedDocuments.has(doc.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedDocuments.has(doc.id)}
                          onCheckedChange={() => toggleDocumentSelection(doc.id)}
                          disabled={doc.status !== "pending"}
                        />
                        
                        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {doc.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {doc.size} • Uploaded {doc.uploadDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {doc.status === "processing" && doc.progress !== undefined && (
                            <div className="w-32">
                              <Progress value={doc.progress} className="h-2" />
                            </div>
                          )}
                          {getStatusBadge(doc.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Processing Dialog with ReactFlow */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Processing Documents</DialogTitle>
            <DialogDescription>
              AI agents are processing your documents through multiple stages
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Document Info */}
            {currentProcessingDoc && (
              <Card className="p-4 bg-primary/5 border-primary">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {currentProcessingDoc.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Processing: {currentProcessingDoc.progress || 0}% complete
                    </div>
                  </div>
                  {getStatusBadge(currentProcessingDoc.status)}
                </div>
                <Progress
                  value={currentProcessingDoc.progress || 0}
                  className="mt-3"
                />
              </Card>
            )}

            {/* Processing Progress */}
            <div className="text-sm text-muted-foreground">
              Processing {Array.from(selectedDocuments).findIndex(id => id === currentProcessingDoc?.id) + 1} of {selectedDocuments.size} selected documents
            </div>

            {/* ReactFlow Workflow Diagram */}
            <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <DocumentProcessingWorkflow
                currentStage={
                  currentProcessingDoc?.progress
                    ? Math.floor(currentProcessingDoc.progress / 25)
                    : 0
                }
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessDocuments;
