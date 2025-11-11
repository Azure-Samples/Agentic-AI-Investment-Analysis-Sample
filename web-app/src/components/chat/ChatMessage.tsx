import { Message } from "./types";
import TextMessage from "./TextMessage";
import MarkdownTextMessage from "./MarkdownTextMessage";
import CardMessage from "./CardMessage";
import EventStatusMessage from "./EventStatusMessage";
import AgentOutputMessage from "./AgentOutputMessage";
import ReasoningMessage from "./ReasoningMessage";
import HumanFeedbackMessage from "./HumanFeedbackMessage";
import ErrorMessage from "./ErrorMessage";

interface ChatMessageProps {
  message: Message;
  onFeedbackSubmit?: (response: any) => void;
  onRestart?: () => void;
}

const ChatMessage = ({ message, onFeedbackSubmit, onRestart }: ChatMessageProps) => {
  switch (message.type) {
    case "text":
      return <TextMessage message={message} />;
    case "markdown_text":
      return <MarkdownTextMessage message={message} />;
    case "card":
      return <CardMessage message={message} />;
    case "event":
      return <EventStatusMessage message={message} />;
    case "agent_output":
      return <AgentOutputMessage message={message} />;
    case "reasoning":
      return <ReasoningMessage message={message} />;
    case "human_feedback":
      return <HumanFeedbackMessage message={message} onFeedbackSubmit={onFeedbackSubmit} />;
    case "error":
      return <ErrorMessage message={message} onRestart={onRestart} />;
    default:
      return null;
  }
};

export default ChatMessage;
