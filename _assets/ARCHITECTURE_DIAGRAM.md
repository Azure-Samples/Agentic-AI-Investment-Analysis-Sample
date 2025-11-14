# Investment Analysis Workflow - SSE Architecture

This document describes the architecture of the real-time investment analysis workflow system, which uses Server-Sent Events (SSE) to stream AI agent execution progress to clients.

## Overview

The system orchestrates multiple AI agents using the Azure Agent Framework to perform comprehensive investment analysis. The architecture supports:
- **Real-time progress streaming** via SSE
- **Multi-agent orchestration** with fan-out/fan-in patterns
- **Debate-driven consensus** between supporting and challenging perspectives
- **Event persistence** for audit trails and replay capability
- **Session-based event queues** for multi-client support

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser/React)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐         ┌──────────────────────┐              │
│  │  Start Analysis      │         │   Event Streaming    │              │
│  │  Button Click        │         │   Component          │              │
│  └──────────┬───────────┘         └──────────┬───────────┘              │
│             │                                 │                         │
│             │ POST /{opportunity_id}/         │ GET /{opportunity_id}/  │
│             │      {analysis_id}/start/       │     {analysis_id}/      │
│             │      {client_id}                │     stream/{client_id}  │
│             │                                 │     (SSE)               │
└─────────────┼─────────────────────────────────┼─────────────────────────┘
              │                                 │
              │                                 │
┌─────────────▼─────────────────────────────────▼──────────────────────────┐
│                         FASTAPI SERVER                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │              analysis.py (Router)                               │     │
│  │                                                                 │     │
│  │  ┌──────────────────────┐      ┌────────────────────────────┐   │     │
│  │  │ start_analysis()     │      │ stream_analysis_events()   │   │     │
│  │  │                      │      │                            │   │     │
│  │  │ 1. Mark as started   │      │ 1. Verify access           │   │     │
│  │  │ 2. Get SSE queue     │      │ 2. Get SSE queue           │   │     │
│  │  │    for client_id     │      │    for client_id           │   │     │
│  │  │ 3. Add to background │      │ 3. Send historical events  │   │     │
│  │  │    tasks             │      │    (if reconnecting)       │   │     │
│  │  │ 4. Return 200 OK     │      │ 4. Register listener       │   │     │
│  │  │                      │      │ 5. Stream live events      │   │     │
│  │  │                      │      │ 6. Cleanup on disconnect   │   │     │
│  │  └──────────┬───────────┘      └──────────────┬─────────────┘   │     │
│  └─────────────┼─────────────────────────────────┼─────────────────┘     │
│                │                                 │                       │
│                │                                 │                       │
│  ┌─────────────▼─────────────────────────────────▼─────────────────┐     │
│  │              BackgroundTasks Queue                              │     │
│  │                                                                 │     │
│  │   ┌──────────────────────────────────────────────────┐          │     │
│  │   │  AnalysisWorkflowExecutorService                 │          │     │
│  │   │    .execute_workflow()                           │          │     │
│  │   │                                                  │          │     │
│  │   │  1. Fetch analysis & opportunity                 │          │     │
│  │   │  2. Initialize workflow with agents              │          │     │
│  │   │  3. Run workflow (streaming)                     │          │     │
│  │   │  4. Handle each event:                           │          │     │
│  │   │     - Add to SSE queue                           │          │     │
│  │   │     - Cache for persistence                      │          │     │
│  │   │     - Update DB (on completion/failure)          │          │     │
│  │   │  5. Persist all events to database               │          │     │
│  │   └────────────────┬─────────────────────────────────┘          │     │
│  └────────────────────┼────────────────────────────────────────────┘     │
│                       │                                                  │
│                       │ emit events                                      │
│                       │                                                  │
│  ┌────────────────────▼─────────────────────────────────────────────┐    │
│  │           SSEStreamEventQueue (Session-scoped)                   │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐     │    │
│  │  │                                                         │     │    │
│  │  │  Events Queue (deque, max 1000):                        │     │    │
│  │  │  [0] workflow_started                                   │     │    │
│  │  │  [1] executor_invoked (data_prepper)                    │     │    │
│  │  │  [2] executor_completed (data_prepper)                  │     │    │
│  │  │  [3] workflow_output (data_prepper)                     │     │    │
│  │  │  [4] executor_invoked (financial_analyst)               │     │    │
│  │  │  [5] executor_invoked (risk_analyst)                    │     │    │
│  │  │  [6] executor_invoked (market_analyst)                  │     │    │
│  │  │  [7] executor_invoked (compliance_analyst)              │     │    │
│  │  │  [8] executor_completed (financial_analyst)             │     │    │
│  │  │  ... (parallel execution)                               │     │    │
│  │  │                                                         │     │    │
│  │  │  Active Listeners: [asyncio.Queue, ...]                 │     │    │
│  │  │  Sequence Number: 42                                    │     │    │
│  │  └─────────────────────────────────────────────────────────┘     │    │
│  │                                                                  │    │
│  │  When event added:                                               │    │
│  │  1. Assign sequence number (auto-increment)                      │    │
│  │  2. Add timestamp if not present                                 │    │
│  │  3. Append to deque                                              │    │
│  │  4. Notify all active listeners via asyncio.Queue                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```


## Detailed Component Interaction

This section illustrates the detailed request flow from client initiation through workflow execution and event streaming.

### Starting an Analysis

The client initiates an analysis which sets up the background workflow execution:

```
┌──────────────┐
│   Client     │
│   Browser    │
└──────┬───────┘
       │
       │ 1. POST /{opportunity_id}/{analysis_id}/start/{client_id}
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Router: start_analysis()                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. Validate client_id parameter                    │  │
│  │                                                    │  │
│  │ 2. analysis_service.start_analysis()               │  │
│  │    - Update status to "in_progress"                │  │
│  │    - Set started_at timestamp                      │  │
│  │                                                    │  │
│  │ 3. sse_queue = get_sse_event_queue_for_session(    │  │
│  │      client_id)                                    │  │
│  │    - Creates/retrieves session-scoped queue        │  │
│  │                                                    │  │
│  │ 4. background_tasks.add_task(                      │  │
│  │      execution_service.execute_workflow,           │  │
│  │      sse_event_queue, analysis_id,                 │  │
│  │      opportunity_id, owner_id                      │  │
│  │    )                                               │  │
│  │                                                    │  │
│  │ 5. return AnalysisResponse                         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
       │
       │ Response (immediate)
       ▼
┌──────────────┐
│   Client     │◄──── 2. GET /{opportunity_id}/{analysis_id}/stream/{client_id} (SSE)
│   Browser    │
└──────┬───────┘
       │
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Router: stream_analysis_events()                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. Verify analysis exists and user has access      │  │
│  │                                                    │  │
│  │ 2. sse_queue = get_sse_event_queue_for_session(    │  │
│  │      client_id)                                    │  │
│  │                                                    │  │
│  │ 3. async def event_generator():                    │  │
│  │   a. Send historical events from queue             │  │
│  │      - If since_sequence provided (reconnect):     │  │
│  │        filter events > since_sequence              │  │
│  │      - Otherwise send all queued events            │  │
│  │                                                    │  │
│  │   b. Register listener with SSE queue              │  │
│  │      listener_queue = sse_queue.register_listener()│  │
│  │                                                    │  │
│  │   c. Loop forever:                                 │  │
│  │      - await listener_queue.get(timeout=30s)       │  │
│  │      - yield event.to_sse_format()                 │  │
│  │      - Send keep-alive on timeout                  │  │
│  │                                                    │  │
│  │   d. On disconnect/completion:                     │  │
│  │      - Unregister listener                         │  │
│  │      - Cleanup session queue                       │  │
│  │                                                    │  │
│  │ 4. Return StreamingResponse with headers:          │  │
│  │    - Content-Type: text/event-stream               │  │
│  │    - Cache-Control: no-cache                       │  │
│  │    - Connection: keep-alive                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
       │
       │ SSE Stream (continuous)
       ▼
┌────────────────────────────────────────────────────────┐
│   Client                                               │
│   Browser                                              │
│                                                        │
│  Events:                                               │
│  ✓ workflow_started                                    | 
│  ✓ executor_invoked (data_prepper)                     |
│  ✓ executor_completed (data_prepper)                   │
│  ✓ workflow_output (data_prepper)                      │
│  ✓ executor_invoked (financial/risk/market/compliance) │
│  ...                                                   |
│  ✓ workflow_status (IDLE = completed)                  │
└────────────────────────────────────────────────────────┘
```

### Background Workflow Execution

The workflow executes in the background, coordinating multiple AI agents:

```
┌────────────────────────────────────────────────────────┐
│  AnalysisWorkflowExecutorService.execute_workflow()    │
└────────┬───────────────────────────────────────────────┘
         │
         ├─> 1. Fetch analysis & opportunity from DB
         │
         ├─> 2. Create AnalysisRunInput
         │      - hypothesis, company_name, industry, stage
         │
         ├─> 3. Initialize InvestmentAnalysisWorkflow
         │      - Get chat_client (Azure OpenAI)
         │      - Build workflow with executors
         │
         ├─> 4. workflow.run_workflow_stream(input)
         │    │
         │    └──> Yields WorkflowEvents:
         │         - WorkflowStartedEvent
         │         - ExecutorInvokedEvent
         │         - ExecutorCompletedEvent
         │         - WorkflowOutputEvent
         │         - ExecutorFailedEvent
         │         - WorkflowStatusEvent
         │         - WorkflowFailedEvent
         │
         ├─> 5. FOR EACH event:
         │      a. _handle_event()
         │         - Map to StreamEventMessage
         │         - Add to SSE queue (notify listeners)
         │         - Cache event for persistence
         │         - Update DB on completion/failure
         │         - Save agent results to analysis
         │
         ├─> 6. workflow_events_service.persist_cached_events()
         │      - Batch insert all events to Cosmos DB
         │      - For audit trail and replay
         │
         └─> 7. Cleanup
              - Log completion/failure
              - Ensure events persisted
```


## Event Flow Sequence

This section shows the temporal sequence of events as they flow through the system during a typical analysis execution.

```
Time  │  Background Workflow           │  SSE Event Queue          │  SSE Stream to Client
──────┼────────────────────────────────┼───────────────────────────┼─────────────────────────
  0   │  Start workflow execution      │                           │
  1   │  WorkflowStartedEvent ─────────┼─> Store [0] seq=0         │
  2   │                                │   Notify listeners ───────┼─> data: {type: "workflow_started", ...}
      │                                │                           │
  3   │  Data prep executor invoked    │                           │
  4   │  ExecutorInvokedEvent ─────────┼─> Store [1] seq=1         │
  5   │  (data_prepper)                │   Notify listeners ───────┼─> data: {type: "executor_invoked", executor: "data_prepper", ...}
      │                                │                           │
  6   │  Data prep completed           │                           │
  7   │  ExecutorCompletedEvent ───────┼─> Store [2] seq=2         │
  8   │                                │   Notify listeners ───────┼─> data: {type: "executor_completed", executor: "data_prepper", ...}
      │                                │                           │
  9   │  WorkflowOutputEvent ──────────┼─> Store [3] seq=3         │
 10   │  (data_prepper output)         │   Notify listeners ───────┼─> data: {type: "workflow_output", executor: "data_prepper", data: {...}}
      │                                │                           │
      │  ┌─────── FAN OUT ────────┐    │                           │
 11   │  │ Financial analyst      │    │                            │
 12   │  │ ExecutorInvokedEvent ──┼────┼─> Store [4] seq=4          │
 13   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_invoked", executor: "financial_analyst", ...}
      │  │                        │    │                            │
 14   │  │ Risk analyst           │    │                            │
 15   │  │ ExecutorInvokedEvent ──┼────┼─> Store [5] seq=5          │
 16   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_invoked", executor: "risk_analyst", ...}
      │  │                        │    │                            │
 17   │  │ Market analyst         │    │                            │
 18   │  │ ExecutorInvokedEvent ──┼────┼─> Store [6] seq=6          │
 19   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_invoked", executor: "market_analyst", ...}
      │  │                        │    │                            │
 20   │  │ Compliance analyst     │    │                            │
 21   │  │ ExecutorInvokedEvent ──┼────┼─> Store [7] seq=7          │
 22   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_invoked", executor: "compliance_analyst", ...}
      │  └────────────────────────┘    │                            │
      │                                │                           │
 ... (parallel AI processing, each completing with ExecutorCompletedEvent and WorkflowOutputEvent)
      │                                │                           │
      │  ┌─────── FAN IN ─────────┐    │                            │
 45   │  │ Analysis aggregator    │    │                            │
 46   │  │ ExecutorInvokedEvent ──┼────┼─> Store [12] seq=12        │
 47   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_invoked", executor: "analysis_aggregator", ...}
 48   │  │ ExecutorCompletedEvent─┼────┼─> Store [13] seq=13        │
 49   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_completed", executor: "analysis_aggregator", ...}
      │  └────────────────────────┘    │                            │
      │                                │                           │
      │  ┌─────── DEBATE ─────────┐    │                            │
 50   │  │ Investment debate exec │    │                            │
 51   │  │ ExecutorInvokedEvent ──┼────┼─> Store [14] seq=14        │
 52   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_invoked", executor: "investment_debate_executor", ...}
      │  │                        │    │                            │
 ... (Group chat: supporter ↔ challenger, multiple rounds)         |
      │  │                        │    │                            │
 70   │  │ ExecutorCompletedEvent─┼────┼─> Store [15] seq=15        │
 71   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_completed", executor: "investment_debate_executor", ...}
 72   │  │ WorkflowOutputEvent ───┼────┼─> Store [16] seq=16        │
 73   │  │                        │    │   Notify listeners ────────┼─> data: {type: "workflow_output", data: {supporter: "...", challenger: "..."}}
      │  └────────────────────────┘    │                            │
      │                                │                           │
      │  ┌─────── SUMMARY ────────┐    │                            │
 74   │  │ Summary report gen     │    │                            │
 75   │  │ ExecutorInvokedEvent ──┼────┼─> Store [17] seq=17        │
 76   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_invoked", executor: "summary_report_generator", ...}
 ... (AI generates final summary)
 85   │  │ ExecutorCompletedEvent─┼────┼─> Store [18] seq=18        │
 86   │  │                        │    │   Notify listeners ────────┼─> data: {type: "executor_completed", ...}
 87   │  │ WorkflowOutputEvent ───┼────┼─> Store [19] seq=19        │
 88   │  │                        │    │   Notify listeners ────────┼─> data: {type: "workflow_output", data: {summary_report_generator: "..."}}
      │  └────────────────────────┘    │                            │
      │                                │                           │
 90   │  All executors complete        │                           │
 91   │  Update analysis status=       │                           │
      │    "completed"                 │                           │
 92   │  WorkflowStatusEvent ──────────┼─> Store [20] seq=20       │
 93   │  (state: IDLE)                 │   Notify listeners ───────┼─> data: {type: "workflow_status", data: {state: "IDLE"}}
      │                                │                           │
 94   │  Persist cached events to DB   │                           │
 95   │                                │                           │
 96   │  Workflow ends                 │                           │  Connection closes naturally
```


## Reconnection Flow

The system supports client reconnection with event replay to handle network interruptions gracefully.

```
┌──────────────┐                          ┌──────────────────┐
│   Client     │                          │ SSE Event Queue  │
└──────┬───────┘                          └──────┬───────────┘
       │                                         │
       │ GET /stream/{client_id}                 │
       ├────────────────────────────────────────>│
       │                                         │
       │ Send events [0-10] ◄────────────────────┤
       │<────────────────────────────────────────┤
       │ (workflow_started, executor_invoked x5, │
       │  executor_completed x5)                 │
       │                                         │
       │ [Connection drops at sequence 10]       │
       │ ✗                                       │
       │                                         │
       │ [Background workflow continues...]      │
       │                          Events [11-20] │
       │                                stored ─>│
       │                           (executor_completed x3,
       │                            workflow_output x3,    │
       │                            debate events, etc.)   │
       │                                         │
       │ [Client reconnects with last sequence]  │
       │                                         │
       │ GET /stream/{client_id}?since_sequence=10
       ├────────────────────────────────────────>│
       │                                         │
       │                     Filter: seq > 10    │
       │                                         │
       │ Send events [11-20] ◄───────────────────┤
       │<────────────────────────────────────────┤
       │ (only missed events)                    │
       │                                         │
       │ Register new listener for live events   │
       │<───────────────────────────────────────>│
       │                                         │
       │ Continue streaming new events...        │
       │<───────────────────────────────────────>│
       │ (executor_invoked, completed, output)   │
       │                                         │
       │ workflow_status (IDLE) ◄────────────────┤
       │ [Analysis complete]                     │
       │                                         │
```

**Key Features:**
- **Sequence Numbers**: Each event gets a unique, monotonically increasing sequence number
- **since_sequence Parameter**: Clients pass the last sequence they received to get only new events
- **Deque Storage**: Events stored in bounded deque (max 1000) to prevent memory issues
- **Session-based Queues**: Each client_id gets its own queue, preventing cross-contamination
- **Automatic Cleanup**: Queue cleaned up when stream closes


## Data Structures

This section describes the key data models used throughout the system.

### StreamEventMessage

The core event model used for SSE streaming:

```python
class StreamEventMessage(BaseModel):
    """Represents a workflow event transformed for SSE transmission"""
    
    type: str                           # Event type (workflow_started, executor_invoked, etc.)
    executor: Optional[str]             # ID of the executor (e.g., "financial_analyst")
    data: Optional[Any]                 # Event-specific payload data
    message: Optional[str]              # Human-readable message
    sequence: Optional[int]             # Auto-assigned sequence number
    correlation_id: Optional[str]       # For tracing related events
    timestamp: Optional[str]            # ISO8601 timestamp (auto-set if not provided)
    additional_context: Optional[Dict]  # Extra metadata
    
    def to_dict() -> Dict
    def to_sse_format() -> str          # Returns: "data: {...json...}\n\n"
```

**Event Types:**
- `workflow_started` - Workflow execution begins
- `executor_invoked` - An executor starts processing
- `executor_completed` - An executor finishes successfully
- `workflow_output` - Executor produces output data
- `executor_failed` - An executor encounters an error
- `workflow_status` - Workflow state change (e.g., IDLE = completed)
- `workflow_failed` - Workflow execution failed

### SSEStreamEventQueue

Session-scoped queue for managing events and listeners:

```python
class SSEStreamEventQueue:
    """Manages SSE stream event queue for a single client session"""
    
    _queue: deque[StreamEventMessage]           # Bounded queue (max 1000)
    _sequence_number: int                       # Auto-incrementing counter
    _listeners: List[asyncio.Queue]             # Active listener queues
    _lock: asyncio.Lock                         # Thread-safety lock
    
    async def add_event(event_msg: StreamEventMessage)
        """Add event, assign sequence, notify all listeners"""
    
    async def get_events(since_sequence: Optional[int]) -> List[StreamEventMessage]
        """Retrieve events, optionally filtered by sequence"""
    
    async def register_listener() -> asyncio.Queue
        """Create new listener for real-time events"""
    
    async def unregister_listener(listener_queue: asyncio.Queue)
        """Remove listener when client disconnects"""
    
    async def clear_event_queue()
        """Clear all events and listeners (cleanup)"""
    
    def get_event_queue_count() -> int
        """Get current queue size"""
```

**Queue Lifecycle:**
1. **Creation**: Created when client starts analysis (`get_sse_event_queue_for_session`)
2. **Population**: Events added by workflow executor as they occur
3. **Consumption**: Multiple listeners can register and receive events
4. **Cleanup**: Cleared when client disconnects (`close_sse_event_queue_for_session`)

### AnalysisRunInput

Input data for the workflow execution:

```python
class AnalysisRunInput(BaseModel):
    """Input parameters for analysis workflow"""
    
    analysis_id: str                    # Analysis document ID
    opportunity_id: str                 # Related opportunity ID
    owner_id: str                       # User who owns this analysis
    hypothesis: str                     # Investment hypothesis to evaluate
    company_name: str                   # Company being analyzed
    industry: str                       # Industry sector
    stage: str                          # Investment stage (Seed, Series A, etc.)
```

### Workflow Event Types (from Agent Framework)

The Agent Framework emits these event types during workflow execution:

```python
WorkflowStartedEvent               # Workflow begins
WorkflowStatusEvent                # State change (RUNNING, IDLE, etc.)
WorkflowOutputEvent                # Executor produces output
WorkflowFailedEvent                # Workflow-level failure

ExecutorInvokedEvent               # Executor starts
ExecutorCompletedEvent             # Executor finishes
ExecutorFailedEvent                # Executor-level failure
```

These are transformed into `StreamEventMessage` objects by `_handle_event()` method.


## Agent Workflow Architecture

This section describes the AI agent orchestration using Azure Agent Framework.

### Workflow Execution Pattern

```
┌──────────────────────────────────────────────────────────────────┐
│  InvestmentAnalysisWorkflow                                      │
│  (Built with Agent Framework WorkflowBuilder)                    │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │  initialize_workflow()
         │
         ├─> Create Executors:
         │   ┌─────────────────────────────────────┐
         │   │ 1. DataPreparationExecutor          │
         │   │ 2. FinancialAnalyst                 │
         │   │ 3. RiskAnalyst                      │
         │   │ 4. MarketAnalyst                    │
         │   │ 5. ComplianceAnalyst                │
         │   │ 6. AnalysisAggregator (fan-in)      │
         │   │ 7. InvestmentDebateWorkflowExecutor │
         │   │ 8. SummaryReportGenerator           │
         │   └─────────────────────────────────────┘
         │
         ├─> Build Workflow Graph:
         │   
         │   [Start] → DataPreparationExecutor
         │                        │
         │             ┌──────────┴──────────┐
         │             │      FAN OUT        │
         │             ▼                     ▼
         │   ┌──────────────────┐   ┌──────────────────┐
         │   │ FinancialAnalyst │   │   RiskAnalyst    │
         │   └──────────────────┘   └──────────────────┘
         │             │                     │
         │             ▼                     ▼
         │   ┌──────────────────┐   ┌──────────────────┐
         │   │  MarketAnalyst   │   │ComplianceAnalyst │
         │   └──────────────────┘   └──────────────────┘
         │             │                     │
         │             └──────────┬──────────┘
         │                        │ FAN IN
         │                        ▼
         │             AnalysisAggregator
         │                        │
         │                        ▼
         │         InvestmentDebateWorkflowExecutor
         │             (Group Chat: Supporter ↔ Challenger)
         │                        │
         │                        ▼
         │             SummaryReportGenerator
         │                        │
         │                        ▼
         │                     [End]
         │
         └─> run_workflow_stream(AnalysisRunInput)
             - Yields WorkflowEvent for each step
             - Each executor processes input and yields output

```

### Executor Details

#### 1. DataPreparationExecutor
**Purpose**: Fetches and prepares data for analysis  
**Input**: `AnalysisRunInput` (hypothesis, company details)  
**Output**: `AnalysisData` (document summaries, financial data, market data, risk factors)  
**Processing**: 
- Retrieves document summaries from database
- Fetches external data sources
- Structures data for downstream analysts

#### 2-5. Analyst Executors (Fan-Out Pattern)

**Base**: `BaseAnalyst` - Abstract class for all analysts  
**Pattern**: Each analyst processes data **in parallel** using ChatAgent

**FinancialAnalyst**
- Analyzes financial metrics, revenue, profitability
- Produces: scores, insights, executive summary

**RiskAnalyst**
- Evaluates risk factors, vulnerabilities
- Produces: risk assessment, mitigation strategies

**MarketAnalyst**
- Analyzes market opportunity, competition, positioning
- Produces: market analysis, growth potential

**ComplianceAnalyst**
- Reviews regulatory compliance, legal issues
- Produces: compliance report, risk areas

**Common Flow for Each Analyst**:
1. Get relevant data slice from `AnalysisData`
2. Format prompt template with company details
3. Create `ChatAgent` with instructions
4. Run AI analysis (Azure OpenAI)
5. Return structured `AnalystResult` with `AnalystResultResponseModel`

#### 6. AnalysisAggregator (Fan-In Pattern)
**Purpose**: Collects all analyst results into single list  
**Input**: `List[AnalystResult]` (from 4 analysts)  
**Output**: Aggregated list forwarded to debate  
**Processing**: Simple aggregation, no AI

#### 7. InvestmentDebateWorkflowExecutor (Group Chat)
**Purpose**: Conducts structured debate on the investment  
**Input**: `List[AnalystResult]`  
**Output**: Supporter and Challenger final positions  
**Processing**:
1. Creates two agents:
   - **InvestmentSupporter**: Argues for the investment
   - **InvestmentChallenger**: Argues against the investment
2. Builds Group Chat with coordinator (manager)
3. Runs multi-round debate (max 4 rounds)
4. Extracts final outputs from each agent
5. Returns `AnalysisResult` with both perspectives

**Debate Pattern**:
```
Coordinator: "Let's discuss [hypothesis]"
  ↓
Supporter: "Here's why we should invest..."
  ↓
Challenger: "However, consider these risks..."
  ↓
Supporter: "Those risks are mitigated by..."
  ↓
Challenger: "But the market dynamics..."
  ↓
[Continue for max_rounds or until coordinator concludes]
```

#### 8. SummaryReportGenerator
**Purpose**: Creates final comprehensive investment report  
**Input**: `AnalysisResult` (all analysts + debate outcomes)  
**Output**: Final summary report text  
**Processing**:
1. Aggregates all analysis inputs
2. Includes debate conclusions
3. Uses ChatAgent to generate executive summary
4. Returns final recommendation and reasoning

### Executor Communication

**Message Passing**:
- `ctx.send_message(data)`: Forwards data to next executor(s)
- `ctx.yield_output(data)`: Emits output for external consumption (triggers WorkflowOutputEvent)

**Context Types**:
- `WorkflowContext[InputType, OutputType]`: Typed context for each executor
- Ensures type safety across workflow stages

## Event Persistence

The system maintains a dual-layer event storage strategy for reliability and performance.

### Two-Tier Storage

```
┌────────────────────────────────────────────────────────┐
│  Tier 1: In-Memory (SSEStreamEventQueue)              │
├────────────────────────────────────────────────────────┤
│  Purpose: Real-time streaming to clients               │
│  Storage: deque (bounded, max 1000 events)             │
│  Lifetime: Duration of client session                  │
│  Cleanup: On client disconnect or session end          │
│                                                         │
│  Advantages:                                            │
│  ✓ Ultra-low latency for live streaming                │
│  ✓ Reconnection support with sequence filtering        │
│  ✓ Multiple simultaneous listeners                     │
│  ✓ No database overhead during workflow                │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  Tier 2: Database (Cosmos DB)                          │
├────────────────────────────────────────────────────────┤
│  Purpose: Permanent audit trail and replay             │
│  Storage: AnalysisWorkflowEvent documents              │
│  Lifetime: Permanent (or until explicitly deleted)     │
│  Persistence: Batch write after workflow completion    │
│                                                         │
│  Advantages:                                            │
│  ✓ Complete audit trail for compliance                 │
│  ✓ Historical replay of analysis execution             │
│  ✓ Post-analysis debugging and optimization            │
│  ✓ Event-sourcing for future features                  │
└────────────────────────────────────────────────────────┘
```

### Event Caching and Persistence Flow

```
Workflow Event Generated
         │
         ├─> 1. Add to SSEStreamEventQueue (immediate)
         │      - Notify active listeners
         │      - Stream to connected clients
         │
         └─> 2. Cache in AnalysisWorkflowEventsService
                (in-memory list during workflow)
                         │
                         │
         [Workflow Completes or Fails]
                         │
                         ▼
         3. persist_cached_events()
            - Batch insert all events to Cosmos DB
            - Associate with analysis_id + opportunity_id
            - Clear cache
```

### Database Schema

**AnalysisWorkflowEvent Document**:
```python
{
    "id": "uuid",
    "analysis_id": "abc-123",
    "opportunity_id": "opp-456",
    "owner_id": "user@example.com",
    "type": "executor_completed",
    "executor": "financial_analyst",
    "data": { ... },
    "message": "Financial analysis completed",
    "sequence": 8,
    "timestamp": "2025-11-14T10:30:45.123Z",
    "correlation_id": "workflow-run-xyz",
    "partition_key": "analysis_id",
    "created_at": "2025-11-14T10:30:45.123Z",
    "is_active": true
}
```

**Indexes**:
- Primary: `analysis_id` (partition key) + `id`
- Secondary: `opportunity_id`, `owner_id`, `timestamp`

### Retrieval Endpoint

```
GET /analysis/{opportunity_id}/{analysis_id}/events
```

**Purpose**: Fetch all persisted events for a completed analysis  
**Use Cases**:
- Historical analysis review
- Debugging workflow issues
- Replay for visualization
- Audit compliance

**Flow**:
1. Client requests events after analysis completion
2. Query Cosmos DB by `analysis_id` + `opportunity_id` + `owner_id`
3. Return chronologically ordered events
4. Frontend can replay workflow visualization

## Key Design Decisions

### 1. Session-Based Event Queues (client_id)

**Decision**: Each client gets a dedicated `SSEStreamEventQueue` identified by `client_id`

**Rationale**:
- **Isolation**: Multiple clients can watch same analysis without interference
- **Cleanup**: Easier to clean up when client disconnects
- **Scaling**: Could be extended to distributed cache (Redis) per session

**Trade-off**: Requires client to generate and maintain `client_id` (typically UUID)

### 2. Event-Driven Architecture with Agent Framework

**Decision**: Use Azure Agent Framework's event streaming instead of custom orchestration

**Benefits**:
- **Built-in Events**: Framework provides standardized event types
- **Parallel Execution**: Fan-out/fan-in patterns handled automatically
- **Type Safety**: Typed contexts ensure correct data flow
- **Reusability**: Executors are modular and testable

**Trade-off**: Tied to Agent Framework abstractions (but provides flexibility)

### 3. Deferred Event Persistence

**Decision**: Persist events in batch after workflow completes, not real-time

**Rationale**:
- **Performance**: Avoids DB writes during time-critical workflow execution
- **Atomicity**: All events persisted together (success/failure)
- **Cost**: Reduces Cosmos DB RU consumption during analysis

**Trade-off**: Events lost if server crashes before persistence (rare, acceptable risk)

### 4. Keep-Alive with 30s Timeout

**Decision**: SSE stream sends keep-alive comments every 30 seconds

**Rationale**:
- **Connection Stability**: Prevents proxy/load balancer timeouts
- **Client Awareness**: Client knows connection is alive even when no events
- **Reconnection**: Client can detect dropped connection and reconnect

**Implementation**: `asyncio.wait_for(listener_queue.get(), timeout=30.0)`

### 5. Bounded Deque (max 1000 events)

**Decision**: Limit in-memory queue size to 1000 events per session

**Rationale**:
- **Memory Safety**: Prevents unbounded growth in long-running analyses
- **Practical Limit**: Typical analysis has ~20-50 events, 1000 is generous buffer
- **Overflow Behavior**: Oldest events dropped (reconnection still works for recent events)

**Trade-off**: Very long-running workflows might lose early events from memory (still in DB)

## Scaling Considerations

### Current Architecture (Single Server)
- In-memory event queues per session
- Local background tasks
- Suitable for: MVP, small teams, low-medium load

### Future Scaling Options

**Horizontal Scaling**:
1. **Externalize Event Queue**: 
   - Use Redis for `SSEStreamEventQueue`
   - Sessions persist across server restarts
   - Multiple API servers share event queues

2. **Dedicated Workflow Workers**:
   - Use message queue (Azure Service Bus, RabbitMQ)
   - API servers enqueue workflow jobs
   - Worker pool executes workflows
   - Workers publish events to Redis/Event Hub

3. **Real-time Event Streaming**:
   - Replace in-memory queues with Azure Event Hubs
   - Stream events to clients via Event Hubs
   - Supports thousands of concurrent clients

**Load Balancing**:
- **Sticky Sessions**: Required if keeping in-memory queues
- **Redis-Backed Sessions**: Allows any server to handle any client

**Database Optimization**:
- **Batch Writes**: Already implemented
- **TTL**: Add time-to-live for old events
- **Archival**: Move old events to cheaper storage (Azure Blob)

## Error Handling

### Workflow Execution Errors

**Executor-Level Failures**:
```python
ExecutorFailedEvent
  ├─> Captured by _handle_event()
  ├─> Emit "executor_failed" to SSE stream
  ├─> Cache for persistence
  └─> Continue workflow (or halt depending on error)
```

**Workflow-Level Failures**:
```python
WorkflowFailedEvent
  ├─> Update analysis status = "failed"
  ├─> Save error_details to database
  ├─> Emit "workflow_failed" to SSE stream
  ├─> Persist all events (including error)
  └─> Close SSE stream
```

**Handling Strategy**:
```python
try:
    async for event in workflow.run_workflow_stream():
        await _handle_event(event)
except Exception as e:
    # 1. Mark analysis as failed
    await analysis_service.fail_analysis(error_details)
    # 2. Emit failure event to clients
    await sse_event_queue.add_event(workflow_failed_event)
    # 3. Persist events even on failure (for debugging)
    await workflow_events_service.persist_cached_events()
```

### SSE Connection Errors

**Client Disconnect**:
- `asyncio.CancelledError` caught in event generator
- Listener unregistered
- Session queue cleaned up

**Stream Error**:
- Error event sent to client: `{type: "error", message: "..."}`
- Finally block ensures cleanup
- Client can reconnect with `since_sequence`

**Network Interruption**:
- Client detects lack of keep-alive
- Client reconnects with last `sequence` number
- Server replays missed events from queue

## Security Considerations

**Authentication**:
- `get_current_active_user` dependency on all endpoints
- JWT/OAuth token validation

**Authorization**:
- `owner_id` filtering ensures users only see their analyses
- Partitioning by `owner_id` in database queries

**Data Privacy**:
- Events contain potentially sensitive business data
- HTTPS required for SSE (prevents eavesdropping)
- Event queues scoped to authenticated sessions

**Rate Limiting** (Future):
- Limit concurrent analyses per user
- Throttle SSE connections per user
- Prevent event queue exhaustion attacks

## Monitoring and Observability

**Key Metrics to Track**:
- Workflow execution time (total, per executor)
- Event queue depth (memory usage)
- SSE connection count (active listeners)
- Event persistence latency
- Executor failure rate
- Analysis completion rate

**Logging**:
- Structured logging with correlation IDs
- Log levels: DEBUG (events), INFO (lifecycle), ERROR (failures)
- Log workflow start/end, executor invocations, errors

**Tracing** (Future Enhancement):
- Add OpenTelemetry spans for each executor
- Distributed tracing for workflow execution
- Link SSE events to workflow traces

## Conclusion

This architecture provides a robust, real-time streaming solution for multi-agent AI workflows with:
- **Real-time Feedback**: Clients see progress as it happens
- **Reliability**: Event persistence ensures audit trail
- **Scalability**: Can be extended to distributed systems
- **Developer Experience**: Clear separation of concerns, typed interfaces
- **Resilience**: Reconnection support, error handling, keep-alive

The dual-tier storage (in-memory + database) balances performance with durability, while the Agent Framework provides a solid foundation for complex multi-agent orchestration.
