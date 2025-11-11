import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatThread } from "./chatHistoryTypes";
import ChatThreadItem from "./ChatThreadItem";

interface ChatHistoryPanelProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
}

const ChatHistoryPanel = ({
  threads,
  currentThreadId,
  isExpanded,
  onToggle,
  onSelectThread,
  onNewChat,
}: ChatHistoryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllThreads, setShowAllThreads] = useState(false);

  const filteredThreads = threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show only last 5 threads unless expanded or searching
  const displayThreads = searchQuery || showAllThreads 
    ? filteredThreads 
    : filteredThreads.slice(0, 5);
  
  const hasMoreThreads = filteredThreads.length > 5;

  return (
    <div
      className={`relative h-[700px] bg-card border-r transition-all duration-300 ${
        isExpanded ? "w-80" : "w-12"
      }`}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
      >
        {isExpanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Recent Chats</h2>
              <Button
                onClick={onNewChat}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Thread List - Scrollable */}
          <ScrollArea className="flex-1">
            <div className="space-y-1.5 pr-3">
              {displayThreads.length > 0 ? (
                displayThreads.map((thread) => (
                  <ChatThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === currentThreadId}
                    onClick={() => onSelectThread(thread.id)}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  {searchQuery ? "No conversations found" : "No chat history yet"}
                </div>
              )}
            </div>

            {/* Show More/Less Button */}
            {hasMoreThreads && !searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllThreads(!showAllThreads)}
                className="mt-2 w-full h-8 text-xs"
              >
                {showAllThreads ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {filteredThreads.length - 5} More
                  </>
                )}
              </Button>
            )}
          </ScrollArea>

          {/* Footer Stats - More Compact */}
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center flex-shrink-0">
            {threads.length} conversation{threads.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryPanel;
