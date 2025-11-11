import { Bot, Brain, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ReasoningMessage as ReasoningMessageType } from "./types";

interface ReasoningMessageProps {
  message: ReasoningMessageType;
}

const ReasoningMessage = ({ message }: ReasoningMessageProps) => {
  return (
    <div className="flex gap-2 justify-start">
      <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <Card className="max-w-[80%] p-2.5 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-3.5 w-3.5 text-purple-500" />
          <h4 className="font-semibold text-foreground text-sm">Thinking Process</h4>
        </div>
        
        <div className="space-y-2">
          {message.steps.map((step) => (
            <div key={step.step} className="flex gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {step.step}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground mb-0.5">{step.description}</p>
                {step.result && (
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <ChevronRight className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground italic">
                      {step.result}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {message.conclusion && (
          <div className="mt-2 pt-2 border-t border-purple-500/20">
            <p className="text-xs font-medium text-foreground">
              <span className="text-purple-600 dark:text-purple-400">Conclusion: </span>
              {message.conclusion}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReasoningMessage;
