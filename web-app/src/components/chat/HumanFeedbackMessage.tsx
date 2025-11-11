import { useState } from "react";
import { Bot, AlertCircle, CheckCircle, XCircle, MessageSquare, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HumanFeedbackMessage as HumanFeedbackMessageType } from "./types";

interface HumanFeedbackMessageProps {
  message: HumanFeedbackMessageType;
  onFeedbackSubmit?: (response: any) => void;
}

const HumanFeedbackMessage = ({ message, onFeedbackSubmit }: HumanFeedbackMessageProps) => {
  const [selectedChoice, setSelectedChoice] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const handleApproval = (approved: boolean) => {
    setSubmitted(true);
    const response = {
      requestId: message.requestId,
      feedbackType: "approval",
      approved,
      timestamp: new Date(),
    };
    if (message.onResponse) {
      message.onResponse(response);
    }
    if (onFeedbackSubmit) {
      onFeedbackSubmit(response);
    }
  };

  const handleChoice = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setSubmitted(true);
    const response = {
      requestId: message.requestId,
      feedbackType: "choice",
      choiceId,
      timestamp: new Date(),
    };
    if (message.onResponse) {
      message.onResponse(response);
    }
    if (onFeedbackSubmit) {
      onFeedbackSubmit(response);
    }
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return;
    setSubmitted(true);
    const response = {
      requestId: message.requestId,
      feedbackType: message.feedbackType,
      value: inputValue,
      timestamp: new Date(),
    };
    if (message.onResponse) {
      message.onResponse(response);
    }
    if (onFeedbackSubmit) {
      onFeedbackSubmit(response);
    }
  };

  const renderApprovalRequest = () => (
    <>
      <div className="flex items-start gap-2 mb-2.5">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground text-sm mb-0.5">{message.question}</h4>
          {message.description && (
            <p className="text-xs text-muted-foreground mb-2">{message.description}</p>
          )}
        </div>
      </div>

      {message.approvalData && (
        <div className="bg-muted/50 rounded-lg p-2 mb-2.5">
          <p className="text-xs font-medium text-foreground mb-1.5">
            Action: {message.approvalData.action}
          </p>
          {message.approvalData.details && (
            <div className="space-y-0.5">
              {Object.entries(message.approvalData.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="text-foreground font-medium">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!submitted ? (
        <div className="flex gap-2">
          <Button 
            onClick={() => handleApproval(true)} 
            className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Approve
          </Button>
          <Button 
            onClick={() => handleApproval(false)} 
            variant="destructive"
            className="flex-1 h-8 text-xs"
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="text-center py-1.5 text-xs text-muted-foreground">
          ✓ Response submitted
        </div>
      )}
    </>
  );

  const renderInfoRequest = () => (
    <>
      <div className="flex items-start gap-2 mb-2.5">
        <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground text-sm mb-0.5">{message.question}</h4>
          {message.description && (
            <p className="text-xs text-muted-foreground">{message.description}</p>
          )}
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-2">
          {message.inputConfig?.multiline ? (
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={message.inputConfig.placeholder || "Enter your response..."}
              rows={3}
              className="w-full text-xs"
            />
          ) : (
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={message.inputConfig?.placeholder || "Enter your response..."}
              className="w-full h-8 text-xs"
              onKeyPress={(e) => e.key === "Enter" && handleInputSubmit()}
            />
          )}
          <Button 
            onClick={handleInputSubmit} 
            className="w-full h-8 text-xs"
            disabled={!inputValue.trim()}
          >
            Submit Response
          </Button>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground mb-0.5">Your response:</p>
          <p className="text-xs text-foreground">{inputValue}</p>
        </div>
      )}
    </>
  );

  const renderChoiceRequest = () => (
    <>
      <div className="flex items-start gap-2 mb-2.5">
        <ListChecks className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground text-sm mb-0.5">{message.question}</h4>
          {message.description && (
            <p className="text-xs text-muted-foreground">{message.description}</p>
          )}
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-1.5">
          {message.choices?.map((choice) => (
            <Button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              variant="outline"
              className="w-full justify-start text-left h-auto py-2 text-xs"
            >
              <div className="flex-1">
                <div className="font-medium">{choice.label}</div>
                {choice.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {choice.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground mb-0.5">You selected:</p>
          <p className="text-xs font-medium text-foreground">
            {message.choices?.find(c => c.id === selectedChoice)?.label}
          </p>
        </div>
      )}
    </>
  );

  const renderInputRequest = () => (
    <>
      <div className="flex items-start gap-2 mb-2.5">
        <MessageSquare className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground text-sm mb-0.5">{message.question}</h4>
          {message.description && (
            <p className="text-xs text-muted-foreground">{message.description}</p>
          )}
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-2">
          {message.inputConfig?.multiline ? (
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={message.inputConfig.placeholder || "Enter your input..."}
              rows={3}
              className="w-full text-xs"
            />
          ) : (
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={message.inputConfig?.placeholder || "Enter your input..."}
              className="w-full h-8 text-xs"
              onKeyPress={(e) => e.key === "Enter" && handleInputSubmit()}
            />
          )}
          {message.inputConfig?.validation && (
            <p className="text-xs text-muted-foreground">
              {message.inputConfig.validation}
            </p>
          )}
          <Button 
            onClick={handleInputSubmit} 
            className="w-full h-8 text-xs"
            disabled={!inputValue.trim()}
          >
            Submit
          </Button>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground mb-0.5">Your input:</p>
          <p className="text-xs text-foreground">{inputValue}</p>
        </div>
      )}
    </>
  );

  const renderContent = () => {
    switch (message.feedbackType) {
      case "approval":
        return renderApprovalRequest();
      case "info_request":
        return renderInfoRequest();
      case "choice":
        return renderChoiceRequest();
      case "input":
        return renderInputRequest();
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-2 justify-start">
      <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <Card className="max-w-[80%] p-2.5 bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20 text-sm">
        {renderContent()}
      </Card>
    </div>
  );
};

export default HumanFeedbackMessage;
