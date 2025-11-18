import { Message } from "./types";

export interface ChatConversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
  tags?: string[];
}

export interface ChatHistoryState {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  isExpanded: boolean;
}
