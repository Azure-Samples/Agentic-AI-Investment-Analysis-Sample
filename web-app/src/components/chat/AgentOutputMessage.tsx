import { Bot, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AgentOutputMessage as AgentOutputMessageType } from "./types";

interface AgentOutputMessageProps {
  message: AgentOutputMessageType;
}

const AgentOutputMessage = ({ message }: AgentOutputMessageProps) => {
  return (
    <div className="flex gap-2 justify-start">
      <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <Card className="max-w-[80%] p-2.5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 text-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h4 className="font-semibold text-foreground text-sm">{message.agentName}</h4>
          {message.confidence !== undefined && (
            <span className="ml-auto text-xs font-medium text-primary">
              {Math.round(message.confidence * 100)}% confident
            </span>
          )}
        </div>
        
        <div className="text-xs text-foreground whitespace-pre-wrap">
          {message.output}
        </div>

        {message.metadata && Object.keys(message.metadata).length > 0 && (
          <div className="mt-2 pt-2 border-t border-primary/20">
            <details className="cursor-pointer">
              <summary className="text-xs font-medium text-muted-foreground hover:text-foreground">
                View metadata
              </summary>
              <div className="mt-1.5 space-y-0.5">
                {Object.entries(message.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-foreground font-mono">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AgentOutputMessage;
