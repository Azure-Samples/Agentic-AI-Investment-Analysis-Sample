import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, Maximize2, BarChart3, TrendingUp, AlertTriangle, Gavel, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownTextMessage as MarkdownTextMessageType } from "./types";
import { get } from "http";

interface MarkdownTextMessageProps {
  message: MarkdownTextMessageType;
}

const MarkdownTextMessage = ({ message }: MarkdownTextMessageProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const snippetLength = message.snippetLength || 150;
  const isLongContent = message.content.length > snippetLength;
  const snippet = isLongContent 
    ? message.content.substring(0, snippetLength) + "..." 
    : message.content;

  const isUser = message.role === "user";

  // Simple markdown to HTML conversion for preview
  const renderMarkdown = (text: string) => {
    return <ReactMarkdown>{text}</ReactMarkdown>;
  };

  const getAssistantName = (assistant_id: string) => {
    switch (assistant_id) {
      case 'financial_analyst_agent_executor':
        return 'Financial Analyst Agent';
      case 'market_analyst_agent_executor':
        return 'Market Analyst Agent';
      case 'risk_analyst_agent_executor':
        return 'Risk Analyst Agent';
      case 'compliance_analyst_agent_executor':
        return 'Compliance Analyst Agent';
      case 'analysis_summarizer':
        return 'Summary Agent';
      default:
        return 'Assistant';
    }
  };

  const getAssistantIcon = (assistant_id: string) => {
    switch (assistant_id) {
      case 'financial_analyst_agent_executor':
        return <div className="bg-blue-500 p-1.5 rounded-lg flex-shrink-0">
                  <BarChart3 className="h-3 w-3 text-white" />
                </div>;
      case 'market_analyst_agent_executor':
        return <div className="bg-green-500 p-1.5 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>;
      case 'risk_analyst_agent_executor':
        return <div className="bg-orange-500 p-1.5 rounded-lg flex-shrink-0">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>;
      case 'compliance_analyst_agent_executor':
        return <div className="bg-yellow-500 p-1.5 rounded-lg flex-shrink-0">
                  <Gavel className="h-3 w-3 text-white" />
                </div>;
      default:
        return <div className="bg-purple-500 p-1.5 rounded-lg flex-shrink-0">
                  <FileText className="h-3 w-3 text-white" />
                </div>;
    }

  };


  return (
    <>
      <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && (
          <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
        <div
          className={`max-w-[80%] p-2.5 rounded-lg ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          
          {message.assistant_id && (
            
            <div className="flex items-start space-x-2 flex-1 min-w-0 mb-1.5">
              {getAssistantIcon(message.assistant_id)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-foreground leading-tight">
                  {getAssistantName(message.assistant_id)}
                </h4>
              </div>
            </div>
          
          )}
          
          {message.title && (
            <h4 className="font-semibold text-sm mb-1.5">
              {message.title}
            </h4>
          )}
          <div className="text-xs whitespace-pre-wrap mb-2">
            {renderMarkdown(snippet)}
          </div>
          {isLongContent && (
            <Button
              variant={isUser ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="h-7 text-xs"
            >
              <Maximize2 className="h-3 w-3 mr-1.5" />
              View Full Content
            </Button>
          )}
        </div>
        {isUser && (
          <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>

      {/* Full Content Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {getAssistantName(message.assistant_id) || "Full Content"}
            </DialogTitle>
            <DialogDescription>
              Viewing full content
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="max-w-none text-sm">
              {renderMarkdown(message.content)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarkdownTextMessage;
