from typing import List, Dict, Any, Optional, AsyncGenerator
import logging
import json

from agent_framework import BaseChatClient, ChatAgent, AgentRunResponse
from app.services.analysis_service import AnalysisService
from app.services.opportunity_service import OpportunityService


logger = logging.getLogger("app.services.analysis_chat_service")


class AnalysisChatService:
    """Service for handling chat-based 'what-if' analysis queries using agent framework"""
    
    def __init__(
        self, 
        chat_client: BaseChatClient,
        analysis_service: AnalysisService,
        opportunity_service: OpportunityService
    ):
        self.chat_client = chat_client
        self.analysis_service = analysis_service
        self.opportunity_service = opportunity_service
    
    async def stream_chat_message(
        self,
        user_message: str,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str,
        message_history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat message response using Server-Sent Events (SSE)
        
        Args:
            user_message: The user's input message
            analysis_id: ID of the analysis being discussed
            opportunity_id: ID of the opportunity being analyzed
            owner_id: ID of the user making the request
            message_history: Optional list of previous messages in the conversation
            
        Yields:
            SSE-formatted chunks of the AI assistant's response
        """
        try:
            # Send initial event
            yield self._format_sse_event("start", {"message": "Processing your question..."})
            
            # Fetch analysis and opportunity context
            analysis = await self.analysis_service.get_analysis_by_id(
                analysis_id=analysis_id,
                opportunity_id=opportunity_id,
                owner_id=owner_id
            )
            
            if not analysis:
                error_msg = "I couldn't find the analysis you're referring to. Please ensure you have access to this analysis."
                yield self._format_sse_event("error", {"message": error_msg})
                yield self._format_sse_event("done", {})
                return
            
            opportunity = await self.opportunity_service.get_opportunity_by_id(
                opportunity_id=opportunity_id,
                owner_id=owner_id
            )
            
            if not opportunity:
                error_msg = "I couldn't find the associated opportunity. Please ensure you have access to this opportunity."
                yield self._format_sse_event("error", {"message": error_msg})
                yield self._format_sse_event("done", {})
                return
            
            # Build context for the agent
            context = self._build_context(analysis, opportunity)
            
            # Create the agent with appropriate instructions
            agent = self._create_chat_agent(context)
            
            # Build conversation history
            conversation_messages = self._build_conversation_history(message_history, user_message)
            
            # Stream response from the agent
            full_response = ""
            async for chunk in agent.run_stream(conversation_messages):
                if hasattr(chunk, 'content') and chunk.content:
                    content = chunk.content
                    full_response += content
                    yield self._format_sse_event("message", {"content": content})
                elif isinstance(chunk, str):
                    full_response += chunk
                    yield self._format_sse_event("message", {"content": chunk})
            
            logger.info(f"Streamed chat response for analysis {analysis_id}")
            
            # Send completion event
            yield self._format_sse_event("done", {"full_message": full_response})
            
        except Exception as e:
            logger.error(f"Error streaming chat message: {str(e)}")
            yield self._format_sse_event("error", {
                "message": f"An error occurred: {str(e)}",
                "error_type": type(e).__name__
            })
            yield self._format_sse_event("done", {})
    
    async def process_chat_message(
        self,
        user_message: str,
        analysis_id: str,
        opportunity_id: str,
        owner_id: str,
        message_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Process a chat message and generate a response using agent framework
        
        Args:
            user_message: The user's input message
            analysis_id: ID of the analysis being discussed
            opportunity_id: ID of the opportunity being analyzed
            owner_id: ID of the user making the request
            message_history: Optional list of previous messages in the conversation
            
        Returns:
            The AI assistant's response
        """
        try:
            # Fetch analysis and opportunity context
            analysis = await self.analysis_service.get_analysis_by_id(
                analysis_id=analysis_id,
                opportunity_id=opportunity_id,
                owner_id=owner_id
            )
            
            if not analysis:
                return "I couldn't find the analysis you're referring to. Please ensure you have access to this analysis."
            
            opportunity = await self.opportunity_service.get_opportunity_by_id(
                opportunity_id=opportunity_id,
                owner_id=owner_id
            )
            
            if not opportunity:
                return "I couldn't find the associated opportunity. Please ensure you have access to this opportunity."
            
            # Build context for the agent
            context = self._build_context(analysis, opportunity)
            
            # Create the agent with appropriate instructions
            agent = self._create_chat_agent(context)
            
            # Build conversation history
            conversation_messages = self._build_conversation_history(message_history, user_message)
            
            # Get response from the agent
            response: AgentRunResponse = await agent.run(
                conversation_messages,
                stream=False
            )
            
            logger.info(f"Generated chat response for analysis {analysis_id}")
            return response.value if hasattr(response, 'value') else str(response)
            
        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}")
            raise
    
    def _build_context(self, analysis: Any, opportunity: Any) -> str:
        """Build context information for the chat agent"""
        context_parts = [
            f"# Investment Analysis Context",
            f"",
            f"## Opportunity Details",
            f"- **Company Name**: {opportunity.company_name}",
            f"- **Industry**: {opportunity.industry}",
            f"- **Stage**: {opportunity.stage}",
            f"- **Description**: {opportunity.description or 'N/A'}",
            f"",
            f"## Analysis Details",
            f"- **Analysis Name**: {analysis.name}",
            f"- **Status**: {analysis.status}",
            f"- **Investment Hypothesis**: {analysis.investment_hypothesis or 'N/A'}",
        ]
        
        # Add agent results if available
        if analysis.agent_results and isinstance(analysis.agent_results, dict):
            context_parts.append("")
            context_parts.append("## Analysis Results")
            
            for agent_name, result in analysis.agent_results.items():
                if isinstance(result, dict):
                    context_parts.append(f"")
                    context_parts.append(f"### {agent_name.replace('_', ' ').title()}")
                    
                    # Add score if available
                    if 'score' in result:
                        context_parts.append(f"- **Score**: {result['score']}/100")
                    
                    # Add key findings if available
                    if 'findings' in result and isinstance(result['findings'], list):
                        context_parts.append(f"- **Key Findings**:")
                        for finding in result['findings'][:3]:  # Limit to top 3
                            context_parts.append(f"  - {finding}")
                    
                    # Add summary if available
                    if 'summary' in result:
                        context_parts.append(f"- **Summary**: {result['summary']}")
        
        # Add final result if available
        if analysis.result:
            context_parts.append("")
            context_parts.append("## Final Analysis Result")
            context_parts.append(analysis.result)
        
        return "\n".join(context_parts)
    
    def _create_chat_agent(self, context: str) -> ChatAgent:
        """Create a chat agent with appropriate instructions"""
        instructions = f"""You are an expert AI investment analyst assistant. Your role is to help users understand and explore investment analysis results through conversational "what-if" scenarios.

{context}

## Your Capabilities:
- Answer questions about the current analysis results
- Explore "what-if" scenarios (e.g., "What if revenue grows by 30%?")
- Explain investment scores and analyst findings
- Provide insights on risk factors, market conditions, and financial metrics
- Discuss implications of potential changes to key assumptions

## Guidelines:
- Be concise and direct in your responses
- Use the context provided to give accurate, data-informed answers
- When discussing hypothetical scenarios, clearly indicate they are estimates
- If you don't have specific data, acknowledge it and provide general insights
- Use financial terminology appropriately but remain accessible
- Focus on actionable insights and clear explanations

Remember: You're here to help users understand their investment analysis and explore different scenarios interactively.
"""
        
        agent = ChatAgent(
            chat_client=self.chat_client,
            instructions=instructions,
            id="investment_chat_analyst",
            name="Investment Chat Analyst"
        )
        
        return agent
    
    def _build_conversation_history(
        self, 
        message_history: Optional[List[Dict[str, str]]], 
        current_message: str
    ) -> str:
        """Build conversation history for the agent"""
        if not message_history:
            return current_message
        
        # Format previous messages
        history_text = []
        for msg in message_history[-10:]:  # Keep last 10 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                history_text.append(f"User: {content}")
            elif role == "assistant":
                history_text.append(f"Assistant: {content}")
        
        # Add current message
        history_text.append(f"User: {current_message}")
        
        return "\n\n".join(history_text)
    
    def _format_sse_event(self, event_type: str, data: Dict[str, Any]) -> str:
        """
        Format data as Server-Sent Events (SSE)
        
        Args:
            event_type: Type of event (start, message, error, done)
            data: Event data
            
        Returns:
            SSE-formatted string
        """
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
