import { Message } from "./types";

export interface ChatThread {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
  tags?: string[];
}

export interface ChatHistoryState {
  threads: ChatThread[];
  currentThreadId: string | null;
  isExpanded: boolean;
}
