import { MessageSquare, Clock } from "lucide-react";
import { ChatThread as ChatThreadType } from "./chatHistoryTypes";
import { formatDistanceToNow } from "date-fns";

interface ChatThreadItemProps {
  thread: ChatThreadType;
  isActive: boolean;
  onClick: () => void;
}

const ChatThreadItem = ({ thread, isActive, onClick }: ChatThreadItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-md transition-colors ${
        isActive
          ? "bg-primary/10 border-primary/20 border"
          : "bg-muted/50 hover:bg-muted border border-transparent"
      }`}
    >
      <div className="flex items-start gap-2 mb-0.5">
        <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`} />
        <h4 className={`font-medium text-xs line-clamp-1 ${
          isActive ? "text-primary" : "text-foreground"
        }`}>
          {thread.title}
        </h4>
      </div>
      
      <p className="text-xs text-muted-foreground line-clamp-1 mb-1 ml-5">
        {thread.preview}
      </p>
      
      <div className="flex items-center justify-between ml-5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-[10px]">{formatDistanceToNow(thread.timestamp, { addSuffix: true })}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {thread.messageCount} msgs
        </span>
      </div>

      {thread.tags && thread.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
          {thread.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

export default ChatThreadItem;
