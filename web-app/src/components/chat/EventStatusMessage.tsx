import { Bot, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EventStatusMessage as EventStatusMessageType } from "./types";

interface EventStatusMessageProps {
  message: EventStatusMessageType;
}

const EventStatusMessage = ({ message }: EventStatusMessageProps) => {
  const getStatusConfig = (status: EventStatusMessageType["status"]) => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          bgColor: "bg-yellow-500/10",
          textColor: "text-yellow-500",
          label: "Pending",
        };
      case "in_progress":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          bgColor: "bg-blue-500/10",
          textColor: "text-blue-500",
          label: "In Progress",
        };
      case "completed":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          bgColor: "bg-green-500/10",
          textColor: "text-green-500",
          label: "Completed",
        };
      case "failed":
        return {
          icon: <XCircle className="h-3.5 w-3.5" />,
          bgColor: "bg-red-500/10",
          textColor: "text-red-500",
          label: "Failed",
        };
    }
  };

  const statusConfig = getStatusConfig(message.status);

  return (
    <div className="flex gap-2 justify-start">
      <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <Card className="max-w-[80%] p-2.5 bg-card text-sm">
        <div className="flex items-start gap-2">
          <div className={`p-1.5 rounded-lg ${statusConfig.bgColor}`}>
            <div className={statusConfig.textColor}>
              {statusConfig.icon}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-semibold text-foreground text-sm">{message.eventName}</h4>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
            {message.description && (
              <p className="text-xs text-muted-foreground mb-1.5">
                {message.description}
              </p>
            )}
            {message.details && (
              <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t">
                {message.details}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EventStatusMessage;
