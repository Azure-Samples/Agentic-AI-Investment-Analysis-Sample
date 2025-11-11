import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, RefreshCw } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatHistoryPanel from "./ChatHistoryPanel";
import { exampleMessages, humanFeedbackExamples, markdownMessageExamples, errorMessageExamples } from "./exampleMessages";
import { mockChatThreads } from "./mockChatHistory";
import type { Message, TextMessage } from "./types";
import type { ChatThread } from "./chatHistoryTypes";

const ChatContainer = () => {
  // Chat history state
  const [threads, setThreads] = useState<ChatThread[]>(mockChatThreads);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>("thread-1");
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // Current chat state
  const [messages, setMessages] = useState<Message[]>(
    threads.find(t => t.id === "thread-1")?.messages || [exampleMessages[0]]
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(1);

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: TextMessage = { role: "user", type: "text", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    // Simulate AI response with example messages
    setTimeout(() => {
      let finalMessages = newMessages;
      if (exampleIndex < exampleMessages.length) {
        finalMessages = [...newMessages, exampleMessages[exampleIndex]];
        setMessages(finalMessages);
        setExampleIndex(prev => prev + 1);
      } else {
        // Fallback to simple text response
        const assistantMessage: TextMessage = {
          role: "assistant",
          type: "text",
          content: "I've shown you all the example message types. Feel free to explore the different visualizations!"
        };
        finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
      }
      updateCurrentThread(finalMessages);
      setIsTyping(false);
    }, 1500);
  };

  const loadNextExample = () => {
    if (exampleIndex < exampleMessages.length) {
      const newMessages = [...messages, exampleMessages[exampleIndex]];
      setMessages(newMessages);
      updateCurrentThread(newMessages);
      setExampleIndex(prev => prev + 1);
    }
  };

  const resetDemo = () => {
    const resetMessages = [exampleMessages[0]];
    setMessages(resetMessages);
    updateCurrentThread(resetMessages);
    setExampleIndex(1);
    setInput("");
  };

  const handleFeedbackSubmit = (response: any) => {
    console.log("Feedback received:", response);
    
    // Add a confirmation message
    const confirmationMessage: TextMessage = {
      role: "assistant",
      type: "text",
      content: `Received your ${response.feedbackType}. ${
        response.approved !== undefined 
          ? response.approved 
            ? "✅ Proceeding with the approved action..." 
            : "❌ Action cancelled as per your decision."
          : response.choiceId 
            ? `Selected option: ${response.choiceId}`
            : "Thank you for your input!"
      }`
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
    updateCurrentThread([...messages, confirmationMessage]);
  };

  // History panel handlers
  const handleSelectThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setCurrentThreadId(threadId);
      setMessages(thread.messages);
      setExampleIndex(1);
    }
  };

  const handleNewChat = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: "New Conversation",
      preview: "Start a new investment analysis...",
      timestamp: new Date(),
      messageCount: 1,
      messages: [exampleMessages[0]],
      tags: ["New"]
    };
    
    setThreads(prev => [newThread, ...prev]);
    setCurrentThreadId(newThread.id);
    setMessages(newThread.messages);
    setExampleIndex(1);
    setInput("");
  };

  const updateCurrentThread = (updatedMessages: Message[]) => {
    if (!currentThreadId) return;
    
    setThreads(prev => prev.map(thread => {
      if (thread.id === currentThreadId) {
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        let preview = "";
        
        if (lastMessage.type === "text") {
          preview = lastMessage.content.substring(0, 100);
        } else if (lastMessage.type === "card") {
          preview = lastMessage.content;
        } else {
          preview = `${lastMessage.type} message`;
        }
        
        return {
          ...thread,
          messages: updatedMessages,
          messageCount: updatedMessages.length,
          preview,
          timestamp: new Date()
        };
      }
      return thread;
    }));
  };

  return (
    <div className="flex h-[700px]">
      {/* Chat History Panel */}
      <ChatHistoryPanel
        threads={threads}
        currentThreadId={currentThreadId}
        isExpanded={isHistoryExpanded}
        onToggle={() => setIsHistoryExpanded(!isHistoryExpanded)}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="h-full flex flex-col p-4 m-4 ml-0">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground line-clamp-1">
                {threads.find(t => t.id === currentThreadId)?.title || "AI What-If Analysis"}
              </h3>
            </div>
            <div className="flex gap-1.5">
              <Button 
                onClick={loadNextExample} 
                size="sm" 
                variant="outline"
                disabled={exampleIndex >= exampleMessages.length}
                className="h-7 text-xs px-2"
              >
                Next ({exampleIndex}/{exampleMessages.length})
              </Button>
              <Button 
                onClick={() => {
                  // Add a markdown message example (the long report)
                  const newMessages = [...messages, markdownMessageExamples[1]];
                  setMessages(newMessages);
                  updateCurrentThread(newMessages);
                }} 
                size="sm" 
                variant="secondary"
                className="h-7 text-xs px-2"
              >
                Markdown
              </Button>
              <Button 
                onClick={() => {
                  // Add a human feedback example
                  const newMessages = [...messages, humanFeedbackExamples[0]];
                  setMessages(newMessages);
                  updateCurrentThread(newMessages);
                }} 
                size="sm" 
                variant="secondary"
                className="h-7 text-xs px-2"
              >
                Feedback
              </Button>
              <Button 
                onClick={() => {
                  // Add an error message example
                  const errorMsg = {
                    ...errorMessageExamples[5],
                    onRestart: resetDemo
                  };
                  const newMessages = [...messages, errorMsg];
                  setMessages(newMessages);
                  updateCurrentThread(newMessages);
                }} 
                size="sm" 
                variant="secondary"
                className="h-7 text-xs px-2"
              >
                Error
              </Button>
              <Button 
                onClick={resetDemo} 
                size="sm" 
                variant="ghost"
                className="h-7 w-7 p-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Messages Area with Fixed Height and Scrolling */}
          <ScrollArea className="flex-1 pr-3" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  message={message} 
                  onFeedbackSubmit={handleFeedbackSubmit}
                  onRestart={resetDemo}
                />
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Invisible element for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Compact Input Area */}
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a 'what if' question..."
              className="flex-1 h-9 text-sm"
            />
            <Button onClick={handleSend} size="icon" className="h-9 w-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatContainer;
