# Analysis SSE Architecture Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐         ┌──────────────────────┐             │
│  │  Start Analysis      │         │   Event Streaming    │             │
│  │  Button Click        │         │   Component          │             │
│  └──────────┬───────────┘         └──────────┬───────────┘             │
│             │                                 │                          │
│             │ POST /start                     │ GET /events (SSE)        │
│             │                                 │                          │
└─────────────┼─────────────────────────────────┼──────────────────────────┘
              │                                 │
              │                                 │
┌─────────────▼─────────────────────────────────▼──────────────────────────┐
│                         FASTAPI SERVER                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              analysis.py (Router)                               │    │
│  │                                                                  │    │
│  │  ┌──────────────────────┐      ┌────────────────────────────┐  │    │
│  │  │ start_analysis()     │      │ stream_analysis_events()   │  │    │
│  │  │                      │      │                            │  │    │
│  │  │ 1. Mark as started   │      │ 1. Verify access           │  │    │
│  │  │ 2. Add to background │      │ 2. Send historical events  │  │    │
│  │  │    tasks             │      │ 3. Register listener       │  │    │
│  │  │ 3. Return 200 OK     │      │ 4. Stream live events      │  │    │
│  │  └──────────┬───────────┘      └──────────────┬─────────────┘  │    │
│  └─────────────┼────────────────────────────────┼────────────────┘    │
│                │                                 │                      │
│                │                                 │                      │
│  ┌─────────────▼─────────────────────────────────▼──────────────────┐  │
│  │                   BackgroundTasks Queue                          │  │
│  │                                                                   │  │
│  │   ┌──────────────────────────────────────────────────┐          │  │
│  │   │  WorkflowExecutor.execute_workflow()             │          │  │
│  │   │                                                   │          │  │
│  │   │  FOR EACH agent IN agents:                       │          │  │
│  │   │    1. Emit "agent_started" event                 │          │  │
│  │   │    2. Execute agent (AI processing)              │◄─────────┼──┤
│  │   │    3. Emit "agent_progress" event                │          │  │
│  │   │    4. Emit "agent_completed" event               │          │  │
│  │   │                                                   │          │  │
│  │   │  5. Update analysis status                       │          │  │
│  │   │  6. Emit "workflow_completed" event              │          │  │
│  │   └────────────────┬──────────────────────────────────┘          │  │
│  └────────────────────┼─────────────────────────────────────────────┘  │
│                       │                                                 │
│                       │ emit events                                     │
│                       │                                                 │
│  ┌────────────────────▼─────────────────────────────────────────────┐  │
│  │                    EventQueue                                     │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────┐    │  │
│  │  │  Analysis ID: abc-123                                   │    │  │
│  │  │                                                          │    │  │
│  │  │  Events Queue:                                          │    │  │
│  │  │  [0] workflow_started                                   │    │  │
│  │  │  [1] agent_started (financial)                          │    │  │
│  │  │  [2] agent_progress (financial)                         │    │  │
│  │  │  [3] agent_completed (financial)                        │    │  │
│  │  │  [4] agent_started (risk)                               │    │  │
│  │  │  ...                                                     │    │  │
│  │  │                                                          │    │  │
│  │  │  Active Listeners: [listener_1, listener_2, ...]        │    │  │
│  │  └─────────────────────────────────────────────────────────┘    │  │
│  │                                                                   │  │
│  │  When event added:                                               │  │
│  │  1. Append to queue with sequence number                         │  │
│  │  2. Notify all active listeners via asyncio.Queue               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Interaction

```
┌──────────────┐
│   Client     │
│   Browser    │
└──────┬───────┘
       │
       │ 1. POST /start
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Router: start_analysis()                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. analysis_service.start_analysis()               │  │
│  │    - Update status to "in_progress"                │  │
│  │    - Set started_at timestamp                      │  │
│  │                                                     │  │
│  │ 2. workflow_executor = WorkflowExecutor(...)       │  │
│  │                                                     │  │
│  │ 3. background_tasks.add_task(                      │  │
│  │      workflow_executor.execute_workflow,           │  │
│  │      analysis_id, opportunity_id, owner_id         │  │
│  │    )                                                │  │
│  │                                                     │  │
│  │ 4. return AnalysisResponse                         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
       │
       │ Response (immediate)
       ▼
┌──────────────┐
│   Client     │◄──── 2. GET /events (SSE)
│   Browser    │
└──────┬───────┘
       │
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Router: stream_analysis_events()                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ async def event_generator():                       │  │
│  │   1. Send historical events (if reconnecting)      │  │
│  │   2. Register listener with EventQueue             │  │
│  │   3. Loop:                                          │  │
│  │      - await listener_queue.get(timeout=30s)       │  │
│  │      - yield event.to_sse_format()                 │  │
│  │      - if workflow_completed: break                │  │
│  │   4. Cleanup listener                              │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
       │
       │ SSE Stream
       ▼
┌──────────────┐
│   Client     │
│   Browser    │
│              │
│  Events:     │
│  ✓ started   │
│  ✓ agent 1   │
│  ✓ agent 2   │
│  ...         │
│  ✓ completed │
└──────────────┘
```

## Event Flow Sequence

```
Time  │  Background Task          │  Event Queue              │  SSE Stream
──────┼───────────────────────────┼───────────────────────────┼────────────────
  0   │  Start workflow           │                           │
  1   │  Emit workflow_started ───┼─> Store event [0]        │
  2   │                           │   Notify listeners ───────┼─> Send to client
      │                           │                           │    data: {event_type: "workflow_started", ...}
      │                           │                           │
  3   │  Start financial agent    │                           │
  4   │  Emit agent_started ──────┼─> Store event [1]        │
  5   │                           │   Notify listeners ───────┼─> Send to client
      │                           │                           │    data: {event_type: "agent_started", agent: "financial", ...}
      │                           │                           │
  6   │  Process financial data   │                           │
  7   │  Emit agent_progress ─────┼─> Store event [2]        │
  8   │                           │   Notify listeners ───────┼─> Send to client
      │                           │                           │    data: {event_type: "agent_progress", ...}
      │                           │                           │
  9   │  Complete financial agent │                           │
 10   │  Emit agent_completed ────┼─> Store event [3]        │
 11   │                           │   Notify listeners ───────┼─> Send to client
      │                           │                           │    data: {event_type: "agent_completed", ...}
      │                           │                           │
 ... (repeat for each agent)                                 │
      │                           │                           │
 50   │  All agents complete      │                           │
 51   │  Update analysis status   │                           │
 52   │  Emit workflow_completed ─┼─> Store event [20]       │
 53   │                           │   Notify listeners ───────┼─> Send to client
      │                           │                           │    data: {event_type: "workflow_completed", ...}
      │                           │                           │
 54   │  Task ends                │                           │  Connection closes
```

## Reconnection Flow

```
┌──────────────┐                          ┌──────────────┐
│   Client     │                          │ Event Queue  │
└──────┬───────┘                          └──────┬───────┘
       │                                         │
       │ GET /events                             │
       ├────────────────────────────────────────>│
       │                                         │
       │ Send events [0, 1, 2, 3, 4, 5] ◄────────┤
       │<────────────────────────────────────────┤
       │                                         │
       │ [Connection drops at sequence 5]        │
       │ ✗                                       │
       │                                         │
       │ [Background task continues]             │
       │                          Events [6, 7, 8, 9, 10]
       │                                    stored ────>│
       │                                         │
       │ [Client reconnects]                     │
       │                                         │
       │ GET /events?since_sequence=5            │
       ├────────────────────────────────────────>│
       │                                         │
       │                          Filter: seq > 5
       │                                         │
       │ Send events [6, 7, 8, 9, 10] ◄──────────┤
       │<────────────────────────────────────────┤
       │                                         │
       │ Continue live streaming...              │
       │<───────────────────────────────────────>│
       │                                         │
```

## Data Structures

```
┌─────────────────────────────────────────────────────────┐
│  AnalysisEvent                                          │
├─────────────────────────────────────────────────────────┤
│  - event_type: str                                      │
│  - agent: str | null                                    │
│  - data: {                                              │
│      sequence: int,                                     │
│      ...custom fields                                   │
│    }                                                    │
│  - message: str                                         │
│  - timestamp: ISO8601 string                            │
│                                                         │
│  Methods:                                               │
│  - to_dict() -> Dict                                    │
│  - to_sse_format() -> str                              │
│    Returns: "data: {...json...}\n\n"                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  EventQueue                                             │
├─────────────────────────────────────────────────────────┤
│  - _queues: Dict[analysis_id, deque[Event]]            │
│  - _sequence_numbers: Dict[analysis_id, int]           │
│  - _listeners: Dict[analysis_id, List[asyncio.Queue]]  │
│  - _lock: asyncio.Lock                                 │
│                                                         │
│  Methods:                                               │
│  - add_event(id, type, agent, data, msg)               │
│  - get_events(id, since_seq) -> List[Event]            │
│  - register_listener(id) -> asyncio.Queue              │
│  - unregister_listener(id, queue)                      │
│  - clear_events(id)                                    │
└─────────────────────────────────────────────────────────┘
```

## Agent Workflow

```
┌─────────────────────────────────────────────────────────┐
│  execute_workflow()                                     │
└────────┬────────────────────────────────────────────────┘
         │
         ├─> Emit: workflow_started
         │
         ├─> FOR EACH agent IN [financial, risk, market, 
         │                      compliance, challenger, 
         │                      supporter, summary]:
         │    │
         │    ├─> Emit: agent_started
         │    │
         │    ├─> Execute: _execute_agent()
         │    │   │
         │    │   ├─> [AI Processing]
         │    │   │   (currently simulated with 2s sleep)
         │    │   │
         │    │   └─> Return: {score, insights, metrics}
         │    │
         │    ├─> Emit: agent_progress (50%)
         │    │
         │    ├─> Emit: agent_completed (with results)
         │    │
         │    └─> Accumulate score
         │
         ├─> Calculate final score
         │
         ├─> Update analysis:
         │   - status = "completed"
         │   - overall_score = average
         │   - agent_results = {...}
         │   - completed_at = now
         │
         └─> Emit: workflow_completed
```
