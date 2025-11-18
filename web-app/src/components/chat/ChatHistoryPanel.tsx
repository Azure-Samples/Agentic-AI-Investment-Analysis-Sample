import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatConversation } from "./chatHistoryTypes";
import ChatConversationItem from "./ChatConversationItem";

interface ChatHistoryPanelProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
}

const ChatHistoryPanel = ({
  conversations,
  currentConversationId,
  isExpanded,
  onToggle,
  onSelectConversation,
  onNewChat,
}: ChatHistoryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllConversations, setShowAllConversations] = useState(false);

  const filteredConversations = conversations?.filter(
    (conversation) =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show only last 5 conversations unless expanded or searching
  const displayConversations = searchQuery || showAllConversations
    ? filteredConversations 
    : filteredConversations.slice(0, 5);
  
  const hasMoreConversations = filteredConversations.length > 5;

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
              {displayConversations.length > 0 ? (
                displayConversations.map((conversation) => (
                  <ChatConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                    onClick={() => onSelectConversation(conversation.id)}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  {searchQuery ? "No conversations found" : "No chat history yet"}
                </div>
              )}
            </div>

            {/* Show More/Less Button */}
            {hasMoreConversations && !searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllConversations(!showAllConversations)}
                className="mt-2 w-full h-8 text-xs"
              >
                {showAllConversations ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {filteredConversations.length - 5} More
                  </>
                )}
              </Button>
            )}
          </ScrollArea>

          {/* Footer Stats - More Compact */}
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center flex-shrink-0">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryPanel;
