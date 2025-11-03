"""
Test script for Analysis SSE Event Streaming

This script demonstrates how to:
1. Create an analysis
2. Start the workflow
3. Stream events via SSE
4. Handle reconnection

Usage:
    python test_analysis_sse.py <opportunity_id> <access_token>
"""

import sys
import requests
import json
import time
from typing import Optional

API_BASE_URL = "http://localhost:8000/api"


def create_analysis(opportunity_id: str, token: str) -> Optional[str]:
    """Create a new analysis"""
    print("\n📝 Creating analysis...")
    
    url = f"{API_BASE_URL}/analysis/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "name": "Test Analysis with SSE",
        "opportunity_id": opportunity_id,
        "investment_hypothesis": "Testing SSE event streaming functionality",
        "tags": ["test", "sse"]
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 201:
        analysis = response.json()
        analysis_id = analysis["id"]
        print(f"✅ Analysis created: {analysis_id}")
        return analysis_id
    else:
        print(f"❌ Failed to create analysis: {response.status_code}")
        print(response.text)
        return None


def start_analysis(opportunity_id: str, analysis_id: str, token: str) -> bool:
    """Start the analysis workflow"""
    print(f"\n🚀 Starting analysis workflow...")
    
    url = f"{API_BASE_URL}/analysis/{opportunity_id}/{analysis_id}/start"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(url, headers=headers)
    
    if response.status_code == 200:
        print("✅ Analysis workflow started")
        return True
    else:
        print(f"❌ Failed to start analysis: {response.status_code}")
        print(response.text)
        return False


def stream_events(opportunity_id: str, analysis_id: str, token: str, since_sequence: Optional[int] = None):
    """Stream analysis events via SSE"""
    print(f"\n📡 Streaming events...")
    if since_sequence is not None:
        print(f"   Resuming from sequence {since_sequence}")
    
    url = f"{API_BASE_URL}/analysis/{opportunity_id}/{analysis_id}/events"
    if since_sequence is not None:
        url += f"?since_sequence={since_sequence}"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "text/event-stream"
    }
    
    last_sequence = -1
    event_count = 0
    
    try:
        with requests.get(url, headers=headers, stream=True, timeout=300) as response:
            if response.status_code != 200:
                print(f"❌ Failed to connect: {response.status_code}")
                return last_sequence
            
            print("✅ Connected to event stream\n")
            
            for line in response.iter_lines():
                if not line:
                    continue
                    
                line = line.decode('utf-8')
                
                # Skip keep-alive comments
                if line.startswith(':'):
                    print("💓 Keep-alive")
                    continue
                
                # Parse SSE data
                if line.startswith('data: '):
                    data_str = line[6:]
                    try:
                        event = json.loads(data_str)
                        event_count += 1
                        last_sequence = event['data'].get('sequence', last_sequence)
                        
                        # Format event output
                        timestamp = event.get('timestamp', '')[:19]
                        event_type = event.get('event_type', 'unknown')
                        agent = event.get('agent', '')
                        message = event.get('message', '')
                        
                        # Color coding based on event type
                        icon = {
                            'workflow_started': '🏁',
                            'workflow_completed': '🎉',
                            'workflow_failed': '💥',
                            'agent_started': '▶️',
                            'agent_progress': '⏳',
                            'agent_completed': '✅',
                            'agent_failed': '❌'
                        }.get(event_type, '📌')
                        
                        print(f"{icon} [{timestamp}] #{last_sequence} {event_type}", end='')
                        if agent:
                            print(f" ({agent})", end='')
                        print(f": {message}")
                        
                        # Show score if available
                        if 'score' in event.get('data', {}):
                            print(f"   Score: {event['data']['score']}/100")
                        
                        # Show overall score on completion
                        if event_type == 'workflow_completed' and 'overall_score' in event.get('data', {}):
                            print(f"\n🏆 FINAL SCORE: {event['data']['overall_score']}/100\n")
                        
                        # Exit on workflow completion or failure
                        if event_type in ['workflow_completed', 'workflow_failed']:
                            print(f"\n📊 Total events received: {event_count}")
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Failed to parse event: {e}")
                        print(f"   Raw data: {data_str}")
            
            print("\n👋 Stream ended")
            
    except requests.exceptions.Timeout:
        print("\n⏱️  Connection timeout")
    except KeyboardInterrupt:
        print(f"\n\n⚠️  Interrupted by user at sequence {last_sequence}")
        print("   You can reconnect using this sequence number to resume")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    return last_sequence


def test_reconnection(opportunity_id: str, analysis_id: str, token: str):
    """Test reconnection scenario"""
    print("\n🔄 Testing reconnection...")
    print("   This will connect, wait 5 seconds, disconnect, then reconnect")
    
    # First connection - partial stream
    print("\n--- First connection ---")
    url = f"{API_BASE_URL}/analysis/{opportunity_id}/{analysis_id}/events"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "text/event-stream"
    }
    
    last_sequence = -1
    
    try:
        with requests.get(url, headers=headers, stream=True, timeout=10) as response:
            print("✅ Connected")
            
            # Read for 5 seconds then disconnect
            start_time = time.time()
            for line in response.iter_lines():
                if time.time() - start_time > 5:
                    break
                
                if line and line.decode('utf-8').startswith('data: '):
                    event = json.loads(line.decode('utf-8')[6:])
                    last_sequence = event['data'].get('sequence', last_sequence)
                    print(f"  Received event #{last_sequence}: {event['event_type']}")
            
            print(f"⚠️  Disconnecting at sequence {last_sequence}")
    
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Wait a moment
    print("\n⏳ Waiting 2 seconds before reconnection...")
    time.sleep(2)
    
    # Reconnect from last sequence
    print(f"\n--- Reconnecting from sequence {last_sequence} ---")
    stream_events(opportunity_id, analysis_id, token, since_sequence=last_sequence)


def main():
    if len(sys.argv) < 3:
        print("Usage: python test_analysis_sse.py <opportunity_id> <access_token>")
        print("\nExample:")
        print("  python test_analysis_sse.py da01cffe-050b-44ee-9a52-157113252de9 your-token-here")
        sys.exit(1)
    
    opportunity_id = sys.argv[1]
    token = sys.argv[2]
    
    print("=" * 60)
    print("Analysis SSE Event Streaming Test")
    print("=" * 60)
    
    # Create analysis
    analysis_id = create_analysis(opportunity_id, token)
    if not analysis_id:
        sys.exit(1)
    
    # Start workflow
    if not start_analysis(opportunity_id, analysis_id, token):
        sys.exit(1)
    
    # Stream events
    print("\n" + "=" * 60)
    last_sequence = stream_events(opportunity_id, analysis_id, token)
    
    # Optionally test reconnection
    print("\n" + "=" * 60)
    test_reconnect = input("\nTest reconnection? (y/n): ").lower().strip() == 'y'
    
    if test_reconnect:
        # Create a new analysis for reconnection test
        print("\n" + "=" * 60)
        print("Creating new analysis for reconnection test...")
        analysis_id = create_analysis(opportunity_id, token)
        if analysis_id:
            start_analysis(opportunity_id, analysis_id, token)
            test_reconnection(opportunity_id, analysis_id, token)
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
