"""
Test script for What-If Chat Workflow

This script demonstrates how to:
1. Initialize the WhatIfChatWorkflow
2. Create test input messages
3. Run the workflow with different thread IDs
4. Test thread persistence and message history
5. Handle workflow outputs

Usage:
    python run_what_if_chat.py
"""

import asyncio
import traceback
import sys
from datetime import datetime

from agent_framework import AgentRunResponseUpdate, ChatMessage, WorkflowOutputEvent

from app.what_if_chat.what_if_workflow import WhatIfChatWorkflow
from app.dependencies import get_chat_client
from app.utils.logging import setup_logger
from app.core.config import settings

# Setup logging
setup_logger()

async def test_single_conversation(chat_client, thread_id: str, message: str, conversation_num: int):
    """Test a single conversation with the workflow"""
    
    print(f"\n💬 Conversation #{conversation_num}")
    print(f"   Thread ID: {thread_id}")
    print(f"   Message: {message}")
    print("-" * 80)
    
    event_count = 0
    
    # Create a new workflow instance with the thread_id
    workflow = WhatIfChatWorkflow(chat_client=chat_client, thread_id=thread_id)
    await workflow.initialize_workflow()
    
    try:
        async for event in workflow.run_workflow_stream(input_message=ChatMessage(role="user", text=message)):
            event_count += 1
            
            # Handle different event types
            if isinstance(event, list):
                print(f"\n   📦 Received {len(event)} final results")
                
                # Display results
                for idx, result in enumerate(event, 1):
                    print(f"\n   📊 Result #{idx}")
                    print(f"      {result}")
            
            elif isinstance(event, WorkflowOutputEvent):
                # Track which agent is currently responding
                current_agent = event.source_executor_id
                print(f"\n   🤖 Agent '{current_agent}' responded:")
                print(f"      {event.data}")    
            
            else:
                # Log other event types if needed
                event_str = str(event)
                if len(event_str) > 200:
                    event_str = event_str[:200] + "..."
                print(f"\n   ℹ️  Event: {event_str}")
    
    except Exception as e:
        print(f"\n❌ Error during conversation: {e}")
        print(f"   Stack Trace:")
        traceback.print_exc()
        print()
        return event_count
    
    
    print(f"\n✅ Conversation completed - Total events: {event_count}")
    print("-" * 80)
    
    return event_count


async def test_workflow():
    """Test the what-if chat workflow"""
    
    print("\n" + "="*80)
    print("🚀 WHAT-IF CHAT WORKFLOW TEST")
    print("="*80 + "\n")
    
    # Step 1: Initialize chat client
    print("🔧 Step 1: Initializing chat client...")
    try:
        chat_client = await get_chat_client()
        print(f"   ✅ Chat client initialized")
        print(f"   ✅ Using endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
        print(f"   ✅ Using deployment: {settings.AZURE_OPENAI_DEPLOYMENT_NAME}")
    except Exception as e:
        print(f"   ❌ Failed to initialize chat client: {e}")
        print("\n⚠️  Make sure your .env file has:")
        print("   - AZURE_OPENAI_ENDPOINT")
        print("   - AZURE_OPENAI_DEPLOYMENT_NAME")
        print("   - Proper Azure credentials configured")
        return
    print()
    
    
    # Step 2: Test with a new thread (first conversation)
    print("▶️  Step 2: Testing with NEW thread - First conversation")
    print("="*80)
    
    thread_id_1 = f"test-thread-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    message_1 = "What if TechCorp Inc. acquires a major competitor? How would this impact their Series B valuation?"
    
    events_1 = await test_single_conversation(chat_client, thread_id_1, message_1, 1)
    
    # Step 3: Test follow-up in the same thread
    print("\n▶️  Step 3: Testing FOLLOW-UP in same thread - Second conversation")
    print("="*80)
    
    message_2 = "What if the acquisition is declined by regulators?"
    
    events_2 = await test_single_conversation(chat_client, thread_id_1, message_2, 2)
    
    # Step 4: Test another follow-up in the same thread
    print("\n▶️  Step 4: Testing ANOTHER FOLLOW-UP in same thread - Third conversation")
    print("="*80)
    
    message_3 = "Can you list back the key questions asked to you in this conversation?"
    
    events_3 = await test_single_conversation(chat_client, thread_id_1, message_3, 3)
    
    # Step 5: Test with a different thread (new conversation)
    print("\n▶️  Step 5: Testing with DIFFERENT thread - New conversation")
    print("="*80)
    
    thread_id_2 = f"test-thread-{datetime.now().strftime('%Y%m%d-%H%M%S')}-2"
    message_4 = "@financial_analyst_agent: What is the financial impact of a 15% increase in interest rates on mid-stage tech startups?"
    
    events_4 = await test_single_conversation(chat_client, thread_id_2, message_4, 4)
    
    # Step 6: Display results summary
    print("\n📊 Step 6: Test Summary")
    print("="*80)
    print(f"   Thread 1 ID: {thread_id_1}")
    print(f"      - Conversation 1 events: {events_1}")
    print(f"      - Conversation 2 events: {events_2}")
    print(f"      - Conversation 3 events: {events_3}")
    print()
    print(f"   Thread 2 ID: {thread_id_2}")
    print(f"      - Conversation 4 events: {events_4}")
    print()
    print(f"   Total conversations tested: 4")
    print(f"   Total threads tested: 2")
    print(f"   Total events processed: {events_1 + events_2 + events_3 + events_4}")
    print()
    
    print("✅ What-If Chat Workflow test completed successfully!")
    print("="*80 + "\n")


def main():
    """Main entry point"""
    
    print("\n🚀 Running What-If Chat Workflow Test...\n")
    asyncio.run(test_workflow())


if __name__ == "__main__":
    main()
