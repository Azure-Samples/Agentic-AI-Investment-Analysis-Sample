import { Bot, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CardMessage as CardMessageType } from "./types";

interface CardMessageProps {
  message: CardMessageType;
}

const CardMessage = ({ message }: CardMessageProps) => {
  const getTrendIcon = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-2 justify-start">
      <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <Card className="max-w-[80%] p-2.5 bg-card text-sm">
        <h4 className="font-semibold text-foreground mb-1.5">{message.title}</h4>
        <p className="text-sm text-muted-foreground mb-2">{message.content}</p>
        
        {message.metrics && message.metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
            {message.metrics.map((metric, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-0.5">
                  {metric.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold text-foreground">
                    {metric.value}
                  </span>
                  {metric.trend && getTrendIcon(metric.trend)}
                </div>
              </div>
            ))}
          </div>
        )}

        {message.data && Object.keys(message.data).length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="space-y-0.5">
              {Object.entries(message.data).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="text-foreground font-medium">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CardMessage;
