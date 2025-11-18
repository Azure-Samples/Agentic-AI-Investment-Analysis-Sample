"""
Test script for Investment Analysis Workflow

This script demonstrates how to:
1. Initialize the InvestmentAnalysisWorkflow
2. Create test input data
3. Run the workflow and stream events
4. Handle workflow outputs

Usage:
    python test_investment_workflow.py
"""

import asyncio
import logging
import sys
from datetime import datetime


from app.workflow.investment_workflow import (
    InvestmentAnalysisWorkflow,
    AnalysisRunInput
)
from app.dependencies import get_chat_client
from app.utils.logging import setup_logger
from app.core.config import settings

# Setup logging
setup_logger()

async def test_workflow():
    """Test the investment analysis workflow"""
    
    print("\n" + "="*80)
    print("🚀 INVESTMENT ANALYSIS WORKFLOW TEST")
    print("="*80 + "\n")
    
    # Step 1: Create test input
    print("📝 Step 1: Creating test analysis input...")
    analysis_input = AnalysisRunInput(
        hypothesis="TechCorp Inc. shows strong revenue growth and market expansion potential in the AI software sector",
        opportunity_id="test-opp-12345",
        analysis_id=f"test-analysis-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        owner_id="test-user-001",
        company_name="TechCorp Inc.",
        stage="Series B",
        industry="AI Software"
    )
    
    print(f"   ✅ Analysis ID: {analysis_input.analysis_id}")
    print(f"   ✅ Company: {analysis_input.company_name}")
    print(f"   ✅ Hypothesis: {analysis_input.hypothesis}")
    print()
    
    # Step 2: Initialize chat client
    print("🔧 Step 2: Initializing chat client...")
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
    
    # Step 3: Initialize workflow
    print("🔧 Step 3: Initializing investment analysis workflow...")
    try:
        workflow = InvestmentAnalysisWorkflow(chat_client=chat_client)
        await workflow.initialize_workflow()
        print("   ✅ Workflow initialized successfully")
        print(f"   ✅ Data Prep Executor: {workflow.data_prep_executor.id}")
        print(f"   ✅ Financial Analyst: {workflow.financial_analyst.id}")
        print(f"   ✅ Risk Analyst: {workflow.risk_analyst.id}")
        print(f"   ✅ Market Analyst: {workflow.market_analyst.id}")
        print(f"   ✅ Analysis Aggregator: {workflow.analysis_aggregator.id}")
    except Exception as e:
        print(f"   ❌ Failed to initialize workflow: {e}")
        print(f" Stack Trace: {sys.exc_info()}")
        return
    print()
    
    # Step 4: Run workflow and stream events
    print("▶️  Step 4: Running workflow and streaming events...")
    print("-" * 80)
    
    event_count = 0
    
    try:
        async for event in workflow.run_workflow_stream(analysis_input):
            event_count += 1
            
            # Log the event type and details
            print(f"\n📨 Event #{event_count}")
            print(f"   Type: {type(event).__name__}")
            
            # Handle different event types
            if isinstance(event, list):
                print(f"   Content: Received {len(event)} results")
                
                # Display results
                for idx, result in enumerate(event, 1):
                    print(f"\n   📊 Analysis Result #{idx}")
                    print(f"      Result: {result}")

            else:
                print(f"   Content: {str(event)}")
            
            print("-" * 80)
    
    except Exception as e:
        print(f"\n❌ Error during workflow execution: {e}")
        print(f" Stack Trace: {sys.exc_info()}")
        return
    
    print()
    
    # Step 5: Display results summary
    print("📊 Step 5: Results Summary")
    print("="*80)
    print(f"   Total events received: {event_count}")
    print()
    
    print("\n✅ Workflow test completed successfully!")
    print("="*80 + "\n")



def main():
    """Main entry point"""
    
    print("\n🚀 Running Investment Workflow...\n")
    asyncio.run(test_workflow())


if __name__ == "__main__":
    main()
