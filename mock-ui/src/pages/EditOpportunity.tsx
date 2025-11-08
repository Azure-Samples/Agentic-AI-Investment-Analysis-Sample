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
  CheckCircle2,
  Clock,
  AlertCircle,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { apiClient, type Opportunity, type Document as ApiDocument } from "@/lib/api-client";

type ProcessingStatus = "completed" | "processing" | "failed" | "pending" | "error";

interface ExistingDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  type: string;
  status: ProcessingStatus;
  tags: string[];
}

interface FileWithTags {
  file: File;
  tags: string[];
}

const EditOpportunity = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const opportunityId = searchParams.get("id");
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newFiles, setNewFiles] = useState<FileWithTags[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([]);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [editingDocumentTags, setEditingDocumentTags] = useState<string | null>(null);
  const [existingDocNewTag, setExistingDocNewTag] = useState("");
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    description: "",
    stage: "",
    amount: "",
    date: "",
    industry: "",
    notes: "",
  });

  // Load opportunity data from API
  useEffect(() => {
    const loadOpportunityData = async () => {
      if (!opportunityId) {
        navigate("/");
        return;
      }

      try {
        setIsLoading(true);

        // Fetch opportunity and documents in parallel
        const [oppData, docsData] = await Promise.all([
          apiClient.getOpportunity(opportunityId),
          apiClient.getOpportunityDocuments(opportunityId),
        ]);

        setOpportunity(oppData);

        // Extract settings from opportunity
        const settings = oppData.settings as Record<string, unknown> || {};
        
        setFormData({
          name: oppData.display_name,
          company: (settings.company as string) || "",
          description: oppData.description,
          stage: (settings.stage as string) || "",
          amount: (settings.amount as string) || "",
          date: (settings.date as string) || "",
          industry: (settings.industry as string) || "",
          notes: (settings.notes as string) || "",
        });

        // Transform documents to UI format
        const transformedDocs: ExistingDocument[] = docsData.map(doc => ({
          id: doc.id,
          name: doc.name,
          size: doc.size,
          uploadDate: new Date(doc.uploaded_at).toISOString().split('T')[0],
          type: doc.mime_type,
          status: doc.processing_status as ProcessingStatus,
          tags: doc.tags,
        }));

        setExistingDocuments(transformedDocs);
      } catch (error) {
        console.error("Failed to load opportunity:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load opportunity data";
        toast({
          title: "Error loading opportunity",
          description: errorMessage.includes("404") 
            ? "This opportunity was not found. It may have been deleted or doesn't exist in the database."
            : errorMessage,
          variant: "destructive",
        });
        // Don't navigate away immediately to let user see the error
        setTimeout(() => navigate("/"), 2000);
      } finally {
        setIsLoading(false);
      }
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
      const files = Array.from(e.target.files).map((file) => ({
        file,
        tags: [],
      }));
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

  const addTagToNewFile = (fileIndex: number, tag: string) => {
    if (!tag.trim()) return;
    
    setNewFiles((prev) =>
      prev.map((fileWithTags, index) =>
        index === fileIndex
          ? { ...fileWithTags, tags: [...fileWithTags.tags, tag.trim()] }
          : fileWithTags
      )
    );
  };

  const removeTagFromNewFile = (fileIndex: number, tagIndex: number) => {
    setNewFiles((prev) =>
      prev.map((fileWithTags, index) =>
        index === fileIndex
          ? {
              ...fileWithTags,
              tags: fileWithTags.tags.filter((_, i) => i !== tagIndex),
            }
          : fileWithTags
      )
    );
  };

  const addTagToExistingDocument = (documentId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setExistingDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, tags: [...doc.tags, tag.trim()] }
          : doc
      )
    );
  };

  const removeTagFromExistingDocument = (documentId: string, tagIndex: number) => {
    setExistingDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, tags: doc.tags.filter((_, i) => i !== tagIndex) }
          : doc
      )
    );
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-600" />;
      case "error":
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    const variants: { [key in ProcessingStatus]: string } = {
      completed: "bg-green-100 text-green-800 border-green-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-gray-100 text-gray-800 border-gray-200",
      error: "bg-red-100 text-red-800 border-red-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };
    
    return (
      <Badge variant="outline" className={`${variants[status]} capitalize`}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const confirmDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete || !opportunityId) return;

    try {
      await apiClient.deleteDocument(opportunityId, documentToDelete);
      
      setExistingDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentToDelete)
      );
      
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully",
      });
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (document: ExistingDocument) => {
    // Open document in new tab for download
    const downloadUrl = `${apiClient['baseUrl']}/api/opportunity/${opportunityId}/documents/${document.id}/download`;
    window.open(downloadUrl, '_blank');
    
    toast({
      title: "Downloading",
      description: `Downloading ${document.name}...`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!opportunityId) {
      return;
    }

    setIsSaving(true);

    try {
      // Update opportunity details
      await apiClient.updateOpportunity(opportunityId, {
        display_name: formData.name,
        description: formData.description,
        settings: {
          company: formData.company,
          stage: formData.stage,
          amount: formData.amount,
          date: formData.date,
          industry: formData.industry,
          notes: formData.notes,
        },
      });

      toast({
        title: "Changes saved successfully",
        description: "The opportunity has been updated",
      });

      // Upload new files if any
      if (newFiles.length > 0) {
        const files = newFiles.map(({ file }) => file);
        const allTags = [...new Set(newFiles.flatMap(({ tags }) => tags))];

        await apiClient.uploadDocuments(opportunityId, files, allTags);

        toast({
          title: "Documents uploaded",
          description: `${newFiles.length} new document(s) uploaded and being processed`,
        });

        // Clear new files
        setNewFiles([]);
      }

      // Reload the opportunity data to reflect changes
      const [oppData, docsData] = await Promise.all([
        apiClient.getOpportunity(opportunityId),
        apiClient.getOpportunityDocuments(opportunityId),
      ]);

      setOpportunity(oppData);
      
      const transformedDocs: ExistingDocument[] = docsData.map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
        uploadDate: new Date(doc.uploaded_at).toISOString().split('T')[0],
        type: doc.mime_type,
        status: doc.processing_status as ProcessingStatus,
        tags: doc.tags,
      }));

      setExistingDocuments(transformedDocs);
      
    } catch (error) {
      console.error("Failed to save changes:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
      toast({
        title: "Save failed",
        description: errorMessage.includes("404")
          ? "This opportunity no longer exists in the database."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
              </Card>            {/* Existing Documents */}
            {existingDocuments.length > 0 && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Existing Documents ({existingDocuments.length})
                </h2>

                <div className="space-y-4">
                  {existingDocuments.map((document) => (
                    <Card key={document.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
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
                          {getStatusBadge(document.status)}
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

                      {/* Processing Status Message */}
                      {document.status === "processing" && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                          AI analysis in progress...
                        </div>
                      )}
                      {document.status === "failed" && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          Processing failed. Please re-upload the document.
                        </div>
                      )}

                      {/* Tags Section */}
                      <div className="space-y-2">
                        <Label className="text-xs">Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {document.tags.map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() =>
                                  removeTagFromExistingDocument(document.id, tagIndex)
                                }
                              />
                            </Badge>
                          ))}
                        </div>
                        {editingDocumentTags === document.id ? (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Add tag (e.g., financial, legal)"
                              className="text-sm"
                              value={existingDocNewTag}
                              onChange={(e) => setExistingDocNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addTagToExistingDocument(document.id, existingDocNewTag);
                                  setExistingDocNewTag("");
                                }
                                if (e.key === "Escape") {
                                  setEditingDocumentTags(null);
                                  setExistingDocNewTag("");
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                addTagToExistingDocument(document.id, existingDocNewTag);
                                setExistingDocNewTag("");
                              }}
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingDocumentTags(null);
                                setExistingDocNewTag("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDocumentTags(document.id)}
                          >
                            <Tag className="mr-2 h-3 w-3" />
                            Add Tag
                          </Button>
                        )}
                      </div>
                    </Card>
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
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    New Documents to Upload ({newFiles.length})
                  </h3>
                  {newFiles.map((fileWithTags, index) => (
                    <Card key={index} className="p-4 bg-blue-50 border border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {fileWithTags.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(fileWithTags.file.size)} • Ready to upload
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

                      {/* Tags Section */}
                      <div className="space-y-2">
                        <Label className="text-xs">Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {fileWithTags.tags.map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeTagFromNewFile(index, tagIndex)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Add tag (e.g., financial, legal, technical)"
                            className="text-sm"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTagToNewFile(index, newTag);
                                setNewTag("");
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              addTagToNewFile(index, newTag);
                              setNewTag("");
                            }}
                          >
                            Add Tag
                          </Button>
                        </div>
                      </div>
                    </Card>
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
