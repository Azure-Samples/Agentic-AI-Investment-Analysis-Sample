import { useState } from "react";
import { Bot, User, Maximize2 } from "lucide-react";
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
  const renderMarkdownPreview = (text: string) => {
    return text;
  };

  // Render full markdown in dialog
  const renderMarkdownFull = (text: string) => {
    // Simple markdown rendering - you can replace this with a proper markdown library like react-markdown
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
      }
      // Bold
      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={index} className="mb-2">
            {parts.map((part, i) => (i % 2 === 0 ? part : <strong key={i}>{part}</strong>))}
          </p>
        );
      }
      // Lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={index} className="ml-4 mb-1">{line.substring(2)}</li>;
      }
      // Code blocks
      if (line.startsWith("```")) {
        return null; // Handle code blocks separately if needed
      }
      // Empty lines
      if (line.trim() === "") {
        return <br key={index} />;
      }
      // Regular text
      return <p key={index} className="mb-2">{line}</p>;
    });
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
          {message.title && (
            <h4 className="font-semibold text-sm mb-1.5">
              {message.title}
            </h4>
          )}
          <div className="text-sm whitespace-pre-wrap mb-2">
            {renderMarkdownPreview(snippet)}
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
              {message.title || "Full Content"}
            </DialogTitle>
            <DialogDescription>
              Viewing complete markdown content
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {renderMarkdownFull(message.content)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarkdownTextMessage;
