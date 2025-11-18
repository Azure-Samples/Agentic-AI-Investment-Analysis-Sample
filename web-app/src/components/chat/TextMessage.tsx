import { Bot, User } from "lucide-react";
import { TextMessage as TextMessageType } from "./types";

interface TextMessageProps {
  message: TextMessageType;
}

const TextMessage = ({ message }: TextMessageProps) => {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg p-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
    </div>
  );
};

export default TextMessage;
