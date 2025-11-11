import { AlertTriangle, XCircle, Wifi, Clock, Cog, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorMessage as ErrorMessageType } from "./types";

interface ErrorMessageProps {
  message: ErrorMessageType;
  onRestart?: () => void;
}

const ErrorMessage = ({ message, onRestart }: ErrorMessageProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorIcon = (errorType: ErrorMessageType["errorType"]) => {
    switch (errorType) {
      case "network":
        return <Wifi className="h-5 w-5" />;
      case "timeout":
        return <Clock className="h-5 w-5" />;
      case "validation":
        return <AlertTriangle className="h-5 w-5" />;
      case "processing":
        return <Cog className="h-5 w-5" />;
      case "system":
      default:
        return <XCircle className="h-5 w-5" />;
    }
  };

  const getErrorColor = (errorType: ErrorMessageType["errorType"]) => {
    switch (errorType) {
      case "network":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/20",
          text: "text-orange-500",
          iconBg: "bg-orange-500/20"
        };
      case "timeout":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          text: "text-amber-500",
          iconBg: "bg-amber-500/20"
        };
      case "validation":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          text: "text-yellow-600 dark:text-yellow-500",
          iconBg: "bg-yellow-500/20"
        };
      case "processing":
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500/20",
          text: "text-purple-500",
          iconBg: "bg-purple-500/20"
        };
      case "system":
      default:
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          text: "text-red-500",
          iconBg: "bg-red-500/20"
        };
    }
  };

  const colors = getErrorColor(message.errorType);
  const handleRestart = () => {
    if (message.onRestart) {
      message.onRestart();
    } else if (onRestart) {
      onRestart();
    }
  };

  return (
    <div className="flex gap-2 justify-start">
      <div className={`${colors.iconBg} p-1.5 rounded-lg flex-shrink-0`}>
        <div className={colors.text}>
          {getErrorIcon(message.errorType)}
        </div>
      </div>
      <Card className={`max-w-[80%] p-2.5 ${colors.bg} ${colors.border}`}>
        {/* Error Header */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <h4 className={`font-semibold text-sm ${colors.text} mb-0.5`}>
              {message.title}
            </h4>
            <p className="text-xs text-foreground">
              {message.message}
            </p>
            {message.errorCode && (
              <p className="text-xs text-muted-foreground mt-1">
                Error Code: <code className="font-mono">{message.errorCode}</code>
              </p>
            )}
          </div>
        </div>

        {/* Error Details (Collapsible) */}
        {message.details && (
          <div className="mt-2 pt-2 border-t border-current/10">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {showDetails ? "Hide" : "Show"} Details
            </button>
            {showDetails && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {message.details}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(message.recoverable !== false || message.onRestart || onRestart) && (
          <div className="mt-2.5 pt-2.5 border-t border-current/10 flex gap-2">
            {(message.recoverable !== false) && (message.onRestart || onRestart) && (
              <Button
                onClick={handleRestart}
                size="sm"
                variant="outline"
                className={`h-7 text-xs flex-1 ${colors.text} border-current/20 hover:bg-current/10`}
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Restart Conversation
              </Button>
            )}
          </div>
        )}

        {/* Recovery Tips */}
        {message.recoverable !== false && !message.onRestart && !onRestart && (
          <div className="mt-2 pt-2 border-t border-current/10">
            <p className="text-xs text-muted-foreground">
              💡 Try refreshing the page or contact support if the issue persists.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ErrorMessage;
