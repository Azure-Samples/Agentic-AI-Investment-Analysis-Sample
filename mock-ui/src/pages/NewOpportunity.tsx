import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle2,
  ChevronRight,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface FileWithTags {
  file: File;
  tags: string[];
}

const NewOpportunity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [files, setFiles] = useState<FileWithTags[]>([]);
  const [newTag, setNewTag] = useState("");

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
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        tags: [],
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      toast({
        title: "Files added",
        description: `${newFiles.length} file(s) ready for upload`,
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTagToFile = (fileIndex: number, tag: string) => {
    if (!tag.trim()) return;
    
    setFiles((prev) =>
      prev.map((fileWithTags, index) =>
        index === fileIndex
          ? { ...fileWithTags, tags: [...fileWithTags.tags, tag.trim()] }
          : fileWithTags
      )
    );
  };

  const removeTagFromFile = (fileIndex: number, tagIndex: number) => {
    setFiles((prev) =>
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

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.company || !formData.stage || !formData.amount) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Move to step 2
    setCurrentStep(2);
    toast({
      title: "Step 1 completed",
      description: "Now upload documents for AI analysis",
    });
  };

  const handleFinalSubmit = () => {
    if (files.length === 0) {
      toast({
        title: "No documents uploaded",
        description: "Please upload at least one document for analysis",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    // Simulate opportunity creation and AI processing
    setTimeout(() => {
      setIsCreating(false);
      toast({
        title: "Opportunity created successfully",
        description: "AI analysis has been initiated on uploaded documents",
      });
      navigate("/");
    }, 2000);
  };

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
              Create New Investment Opportunity
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentStep === 1
                ? "Fill in the details for the investment opportunity"
                : "Upload relevant documents for AI analysis"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > 1 ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    "1"
                  )}
                </div>
                <div className="ml-3 mr-8">
                  <p className="text-sm font-medium text-foreground">
                    Opportunity Details
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Basic information
                  </p>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground mx-4" />

              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= 2
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">
                    Upload Documents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add & tag files
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Opportunity Details */}
          {currentStep === 1 && (
            <form onSubmit={handleStepOneSubmit}>
              {/* Basic Information */}
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Opportunity Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., SaaS Platform Expansion"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
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
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg">
                  Next: Upload Documents
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Document Upload */}
          {currentStep === 2 && (
            <div>
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Documents <span className="text-red-500 ml-1">*</span>
                </h2>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors mb-6">
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
                      Upload Documents
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports PDF, DOC, DOCX, XLS, XLSX, CSV, TXT
                    </p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      Uploaded Documents ({files.length})
                    </h3>
                    {files.map((fileWithTags, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {fileWithTags.file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(fileWithTags.file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
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
                                  onClick={() => removeTagFromFile(index, tagIndex)}
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
                                  addTagToFile(index, newTag);
                                  setNewTag("");
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                addTagToFile(index, newTag);
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
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isCreating}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Details
                </Button>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isCreating}
                    size="lg"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Opportunity...
                      </>
                    ) : (
                      "Create Opportunity"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewOpportunity;
