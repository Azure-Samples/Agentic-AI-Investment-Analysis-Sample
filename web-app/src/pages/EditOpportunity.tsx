import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload as UploadIcon,
  FileText,
  X,
  Loader2,
  Building2,
  DollarSign,
  Calendar,
  Tag,
  Download,
  Trash2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface ExistingDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  type: string;
}

const EditOpportunity = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const opportunityId = searchParams.get("id");
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([]);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    description: "",
    stage: "",
    amount: "",
    date: "",
    contactName: "",
    contactEmail: "",
    industry: "",
    notes: "",
  });

  // Mock data loading - replace with actual API call
  useEffect(() => {
    const loadOpportunityData = () => {
      if (!opportunityId) {
        navigate("/");
        return;
      }

      // Simulate API call
      setTimeout(() => {
        // Mock data based on opportunity ID
        const mockOpportunities: { [key: string]: any } = {
          "1": {
            name: "SaaS Platform Expansion",
            company: "TechCo Solutions",
            description: "Enterprise SaaS platform for project management",
            stage: "series-b",
            amount: "15M",
            date: "2025-10-15",
            contactName: "Jane Doe",
            contactEmail: "jane@techco.com",
            industry: "technology",
            notes: "Strong team with proven track record",
            documents: [
              {
                id: "doc1",
                name: "Business_Plan_2025.pdf",
                size: 2457600,
                uploadDate: "2025-09-15",
                type: "application/pdf",
              },
              {
                id: "doc2",
                name: "Financial_Statements_Q3.xlsx",
                size: 1536000,
                uploadDate: "2025-09-20",
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              },
              {
                id: "doc3",
                name: "Market_Analysis.docx",
                size: 983040,
                uploadDate: "2025-09-25",
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              },
            ],
          },
          "2": {
            name: "Green Energy Initiative",
            company: "EcoPower Inc",
            description: "Renewable energy solutions for commercial buildings",
            stage: "series-a",
            amount: "8M",
            date: "2025-10-20",
            contactName: "Michael Chen",
            contactEmail: "mchen@ecopower.com",
            industry: "energy",
            notes: "Innovative solar panel technology",
            documents: [
              {
                id: "doc4",
                name: "Technical_Whitepaper.pdf",
                size: 3145728,
                uploadDate: "2025-09-10",
                type: "application/pdf",
              },
              {
                id: "doc5",
                name: "Revenue_Projections.xlsx",
                size: 819200,
                uploadDate: "2025-09-18",
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              },
            ],
          },
          "3": {
            name: "Healthcare AI Platform",
            company: "MediTech AI",
            description: "AI-powered diagnostic assistance platform",
            stage: "seed",
            amount: "3.5M",
            date: "2025-10-25",
            contactName: "Dr. Sarah Johnson",
            contactEmail: "sjohnson@meditech.ai",
            industry: "healthcare",
            notes: "FDA approval in progress",
            documents: [
              {
                id: "doc6",
                name: "Clinical_Trial_Results.pdf",
                size: 4194304,
                uploadDate: "2025-09-05",
                type: "application/pdf",
              },
            ],
          },
        };

        const opportunityData = mockOpportunities[opportunityId];
        
        if (opportunityData) {
          setFormData({
            name: opportunityData.name,
            company: opportunityData.company,
            description: opportunityData.description,
            stage: opportunityData.stage,
            amount: opportunityData.amount,
            date: opportunityData.date,
            contactName: opportunityData.contactName,
            contactEmail: opportunityData.contactEmail,
            industry: opportunityData.industry,
            notes: opportunityData.notes,
          });
          setExistingDocuments(opportunityData.documents);
        } else {
          toast({
            title: "Opportunity not found",
            description: "The requested opportunity could not be found",
            variant: "destructive",
          });
          navigate("/");
        }
        
        setIsLoading(false);
      }, 500);
    };

    loadOpportunityData();
  }, [opportunityId, navigate, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...files]);
      toast({
        title: "Files added",
        description: `${files.length} file(s) ready for upload`,
      });
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
  };

  const handleDeleteDocument = () => {
    if (documentToDelete) {
      setExistingDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentToDelete)
      );
      toast({
        title: "Document removed",
        description: "The document has been marked for deletion",
      });
      setDocumentToDelete(null);
    }
  };

  const handleDownloadDocument = (document: ExistingDocument) => {
    // Simulate document download
    toast({
      title: "Downloading",
      description: `Downloading ${document.name}...`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.company || !formData.stage || !formData.amount) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Simulate save operation
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Changes saved successfully",
        description: "The opportunity has been updated",
      });
      
      // If new files were uploaded, show additional message
      if (newFiles.length > 0) {
        setTimeout(() => {
          toast({
            title: "Processing new documents",
            description: `${newFiles.length} new document(s) are being analyzed by AI`,
          });
        }, 500);
      }
      
      navigate("/");
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Opportunities
            </Button>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Edit Investment Opportunity
            </h1>
            <p className="text-sm text-muted-foreground">
              Update opportunity details and manage documents
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name field - Read only */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Opportunity Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    The opportunity name cannot be edited
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="e.g., TechCo Solutions"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">
                    Investment Stage <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => handleSelectChange("stage", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series-a">Series A</SelectItem>
                      <SelectItem value="series-b">Series B</SelectItem>
                      <SelectItem value="series-c">Series C</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="pre-ipo">Pre-IPO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Investment Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      name="amount"
                      type="text"
                      placeholder="e.g., 5M"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) =>
                      handleSelectChange("industry", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Target Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of the investment opportunity..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                <Tag className="mr-2 h-5 w-5" />
                Contact Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    placeholder="e.g., John Smith"
                    value={formData.contactName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="e.g., john@company.com"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional notes or considerations..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Existing Documents */}
            {existingDocuments.length > 0 && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Existing Documents ({existingDocuments.length})
                </h2>

                <div className="space-y-2">
                  {existingDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {document.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(document.size)} • Uploaded on{" "}
                            {formatDate(document.uploadDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteDocument(document.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Upload New Documents */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                <UploadIcon className="mr-2 h-5 w-5" />
                Upload New Documents
              </h2>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors mb-4">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    Upload Additional Documents
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports PDF, DOC, DOCX, XLS, XLSX, CSV, TXT
                  </p>
                </label>
              </div>

              {newFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    New Documents to Upload ({newFiles.length})
                  </h3>
                  {newFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • Ready to upload
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNewFile(index)}
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} size="lg">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog
        open={documentToDelete !== null}
        onOpenChange={() => setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditOpportunity;
