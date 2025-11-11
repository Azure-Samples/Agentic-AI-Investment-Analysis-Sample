import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAnalysisEvents } from '@/lib/api/analysisEvents';
import type { EventMessage } from '@/lib/api/analysisEvents';
import { analysis as analysisApi } from '@/lib/api';
import type { Analysis } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import AgentWorkflow from '@/components/AgentWorkflow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, BarChart3, CheckCircle, Circle, Expand, FileText, TrendingUp, List, Check, Copy, Gavel } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { get } from 'http';

interface AnalysisProcessingWorkflowProps {
  opportunityId: string;
  analysisId: string;
  analysisStatus?: string; // Pass the status from parent to avoid extra API calls
  onComplete?: (status: string, data: any) => void;
}

export function AnalysisProcessingWorkflow({ 
  opportunityId, 
  analysisId,
  analysisStatus,
  onComplete 
}: AnalysisProcessingWorkflowProps) {

  // Function to create initial agent status
  const createInitialAgentStatus = () => ({
    data_prepper: { name: 'data_prepper', displayName: 'Data Preparation Agent', icon: BarChart3, color: 'bg-blue-500', status: 'pending' as const },
    financial_analyst: { name: 'financial_analyst', displayName: 'Financial Analysis Agent', icon: BarChart3, color: 'bg-blue-500', status: 'pending' as const },
    risk_analyst: { name: 'risk_analyst', displayName: 'Risk Analysis Agent', icon: AlertTriangle, color: 'bg-orange-500', status: 'pending' as const },
    market_analyst: { name: 'market_analyst', displayName: 'Market Analysis Agent', icon: TrendingUp, color: 'bg-green-500', status: 'pending' as const },
    compliance_analyst: { name: 'compliance_analyst', displayName: 'Compliance Analysis Agent', icon: Gavel, color: 'bg-yellow-500', status: 'pending' as const },
    investment_challenger: { name: 'investment_challenger', displayName: 'Investment Challenger Agent', icon: Circle, color: 'bg-red-500', status: 'pending' as any, data: null as any },
    investment_supporter: { name: 'investment_supporter', displayName: 'Investment Supporter Agent', icon: CheckCircle, color: 'bg-green-600', status: 'pending' as any, data: null as any },
    summary_report_generator: { name: 'summary_report_generator', displayName: 'Summary Agent', icon: FileText, color: 'bg-purple-500', status: 'pending' as const },
  });

  const [agentStatus, setAgentStatus] = useState<Record<string, {
    status: 'pending' | 'running' | 'completed' | 'failed';
    name?: string;
    displayName?: string;
    icon?: any;
    color?: string;
    data?: any;
    extractedResult?: string[];
  }>>(createInitialAgentStatus());

  const [cachedAnalysisData, setCachedAnalysisData] = useState<Analysis | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [processedSequences, setProcessedSequences] = useState<Set<number>>(new Set());
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const [isLoadingCachedResults, setIsLoadingCachedResults] = useState(false);

  // Preserve events even after completion
  const [preservedEvents, setPreservedEvents] = useState<EventMessage[]>([]);

  const [isAgentDetailOpen, setIsAgentDetailOpen] = useState(false);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
 // Determine if we should use SSE based on analysis status
  const isCompleted = analysisStatus === 'completed' || analysisStatus === 'failed';
  
  // Connect to SSE for live updates (only if not completed)
  const sseHook = useAnalysisEvents(
    opportunityId,
    analysisId,
    isCompleted
  );

  // Use SSE data, but preserve events after completion
  const { events: liveEvents, connectionState, lastSequence, reconnect } = sseHook;
  
  // Update preserved events whenever we get new live events
  useEffect(() => {
    if (liveEvents.length > 0) {
      setPreservedEvents(liveEvents);
    }
  }, [liveEvents]);
  
  // Use live events if available, otherwise use preserved events
  const events = liveEvents.length > 0 ? liveEvents : preservedEvents;
  
  // Load cached results if analysis is already completed
  useEffect(() => {
    const loadCachedResults = async () => {
      if (!isCompleted || !opportunityId || !analysisId) return;
      
      try {
        setIsLoadingCachedResults(true);
        // reset the agent status data
        setAgentStatus([] as any);

        const analysisData: Analysis = await analysisApi.getAnalysis(opportunityId, analysisId);

        setCachedAnalysisData(analysisData);

        console.log('Loading cached results for completed analysis:', analysisData);
        
        // Set workflow status based on analysis status
        setWorkflowStatus(analysisData.status as 'completed' | 'failed');
        
        // Parse agent results and populate agent status
        if (analysisData.agent_results && Object.keys(analysisData.agent_results).length > 0) {
          const updatedAgentStatus = createInitialAgentStatus();
          
          Object.entries(analysisData.agent_results).forEach(([agentName, result]: [string, any]) => {
            if (agentName === 'investment_debate_executor') {
              // Mark both investment agents as completed
              updatedAgentStatus['investment_supporter'] = {
                ...updatedAgentStatus['investment_supporter'],
                status: 'completed',
                data: result
              };

              updatedAgentStatus['investment_challenger'] = {
                ...updatedAgentStatus['investment_challenger'],
                status: 'completed',
                data: result
              };

            }
            else if (updatedAgentStatus[agentName]) {
              updatedAgentStatus[agentName] = {
                ...updatedAgentStatus[agentName],
                status: 'completed',
                data: result
              };
            }
          });
          
          setAgentStatus(updatedAgentStatus);
        }

        // Fetch events from the api and set preserved events
        const fetchedEvents = await analysisApi.fetchAnalysisEvents(opportunityId, analysisId);

        setPreservedEvents(fetchedEvents || []);

      } catch (error) {
        console.error('Error loading cached results:', error);
        // Fall back to showing pending state
      } finally {
        setIsLoadingCachedResults(false);

        if ((workflowStatus === 'completed' || workflowStatus === 'failed') && onComplete) {
          onComplete(workflowStatus, cachedAnalysisData);
        }
      }
    };
    
    loadCachedResults();
  }, [analysisId, opportunityId]); // Only re-run when these change

  // Reset state when analysisId changes (new analysis run selected)
  useEffect(() => {
    // Don't reset if we're loading cached results - let the cache loader handle it
    if (isCompleted) return;
    
    setAgentStatus(createInitialAgentStatus());

    setWorkflowStatus('idle');
    setProcessedSequences(new Set());
    setPreservedEvents([]); // Clear preserved events when switching analysis
  }, [analysisId, isCompleted]);

  // Process events and update UI state (only for live SSE updates)
  useEffect(() => {
    // Skip event processing if using cached results
    if (isCompleted) return;
    
    if (events.length === 0) return;

    // Process only new events that haven't been processed yet
    const newEvents = events.filter(event => !processedSequences.has(event.sequence));
    
    if (newEvents.length === 0) return;

    console.log('Processing new events:', newEvents);

    // Mark these events as processed
    setProcessedSequences(prev => {
      const next = new Set(prev);
      newEvents.forEach(event => next.add(event.sequence));
      return next;
    });

    // Process each new event
    newEvents.forEach(event => {
      switch (event.type) {
        case 'workflow_started':
          setWorkflowStatus('running');
          break;
        
        case 'executor_invoked':
          if (event.executor) {
            
            // Handle specific executor invocation
            if (event.executor === 'investment_debate_executor') {
              // Mark both investment agents as running
              setAgentStatus(prev => ({
                ...prev,
                'investment_supporter': { 
                  ...prev['investment_supporter'],
                  status: 'running' 
                },
                'investment_challenger': { 
                  ...prev['investment_challenger'],
                  status: 'running' 
                }
              }));
            }
            
            setAgentStatus(prev => ({
              ...prev,
              [event.executor!]: { 
                ...prev[event.executor!],
                status: 'running' 
              }
            }));
          }
          break;

        // case 'executor_completed':
        //   if (event.executor) {
        //     setAgentStatus(prev => ({
        //       ...prev,
        //       [event.executor!]: {
        //         ...prev[event.executor!],
        //         status: 'completed',
        //         data: event.data
        //       }
        //     }));
        //   }
        //   break;

        case 'workflow_output':
          if (event.executor) {
            // Handle specific executor invocation
            if (event.executor === 'investment_debate_executor') {
              // Mark both investment agents as completed
              setAgentStatus(prev => ({
                ...prev,
                'investment_supporter': {
                  ...prev['investment_supporter'],
                  status: 'completed',
                  data: event.data
                },
                'investment_challenger': {
                  ...prev['investment_challenger'],
                  status: 'completed',
                  data: event.data
                }
              }));
            } else {
                setAgentStatus(prev => ({
                    ...prev,
                    [event.executor!]: {
                      ...prev[event.executor!],
                    status: 'completed',
                    data: event.data
                  }
                }));
            }
          }
          break;

        case 'executor_failed':
          if (event.executor) {
            setAgentStatus(prev => ({
              ...prev,
              [event.executor!]: { 
                ...prev[event.executor!],
                status: 'failed' 
              }
            }));
          }
          break;

        case 'workflow_status':
          // Workflowe status update, when state is IDLE means completed
          if (event.data?.state === 'IDLE') {
            setWorkflowStatus('completed');
            if (onComplete) {
              onComplete('completed', event.data);
            }
          }
          break;

        case 'workflow_failed':
          setWorkflowStatus('failed');
          if (onComplete) {
            onComplete('failed', event.data);
          }
          break;
      }
    });
  }, [events, processedSequences, onComplete, isCompleted]);

  const getExecutorStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-400';
      case 'running': return 'bg-blue-400';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleExpandAgentReport = (agentName: string) => {
    setSelectedAgentDetail(agentName);
    setIsAgentDetailOpen(true);
    setIsCopied(false);
  };

  const handleCopyToClipboard = async () => {
    if (selectedAgent) {
      try {
        await navigator.clipboard.writeText(selectedAgent.data.join('\n'));
        setIsCopied(true);
        
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const selectedAgent = Object.entries(agentStatus).find(([name, _]) => name === selectedAgentDetail)?.[1];

  const getSelectedAgentDetailReportContent = () => {
    if (!selectedAgent) return null;

    // Extract the data based on agent type
    const agentData = selectedAgent.data;

    // If the agent is one of the core analysts, show executive summary
    if (['financial_analyst', 'risk_analyst', 'market_analyst', 'compliance_analyst'].includes(selectedAgentDetail)) {
      const executiveSummary = agentData?.executive_summary || '';
      const ai_agent_analysis = agentData?.ai_agent_analysis || '';
      const conclusions = agentData?.conclusions || '';
      const sources = agentData?.sources || '';

      const report_text = `# **Executive Summary**\n${executiveSummary}\n\n# **AI Agent Analysis**\n${ai_agent_analysis}\n\n# **Conclusions**\n${conclusions}\n\n# **Sources**\n${sources}`;

      return (
          <ReactMarkdown>{report_text}</ReactMarkdown>
      );
    }
    else if (['investment_supporter'].includes(selectedAgentDetail)) {
      const report_text = agentData?.investment_supporter || '';
      return (
        <ReactMarkdown>{report_text}</ReactMarkdown>
      );
    } else if (['investment_challenger'].includes(selectedAgentDetail)) {
      const report_text = agentData?.investment_challenger || '';
      return (
        <ReactMarkdown>{report_text}</ReactMarkdown>
      );
    } else if (['summary_report_generator'].includes(selectedAgentDetail)) {
      const report_text = agentData?.summary_report_generator || '';
      return (
        <ReactMarkdown>{report_text}</ReactMarkdown>
      );
    }

    return (
      <div>
        No detailed report available for this agent.
      </div>
    );
  };

  const allCoreAgentsPending = ['financial_analyst', 'risk_analyst', 'market_analyst', 'compliance_analyst'].every(agentName => 
    agentStatus[agentName]?.status === 'pending'
  );

  const allPerspectiveAgentsPending = ['investment_supporter', 'investment_challenger'].every(agentName => 
    agentStatus[agentName]?.status === 'pending'
  );

  const summaryAgentPending = agentStatus['summary_report_generator']?.status === 'pending';

  const allAgentsPending = Object.values(agentStatus).every(agent => 
    agent.status === 'pending'
  );


  return (
    <div className="space-y-6">
      
      {/* Compact Status Bar: Connection + Workflow + Events */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gray-50 rounded-lg text-sm">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isCompleted ? 'bg-gray-400' :
            connectionState === 'connected' ? 'bg-green-500' :
            connectionState === 'connecting' ? 'bg-yellow-500' :
            connectionState === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          <span className="font-medium">
            {isCompleted ? 'Cached Results' :
             connectionState === 'connected' ? 'Connected' :
             connectionState === 'connecting' ? 'Connecting...' :
             connectionState === 'error' ? 'Error' :
             'Disconnected'}
          </span>
          {connectionState === 'error' && !isCompleted && (
            <Button
              onClick={reconnect}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              Reconnect
            </Button>
          )}
        </div>

        {/* Workflow Status */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Workflow:</span>
          <span className={`font-semibold ${
            workflowStatus === 'running' ? 'text-blue-600' :
            workflowStatus === 'completed' ? 'text-green-600' :
            workflowStatus === 'failed' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {workflowStatus.toUpperCase()}
          </span>
        </div>

        {/* Event Log Summary */}
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <>
              <span className="text-gray-500 text-xs truncate max-w-xs">
                Latest: {events[events.length - 1].type}
                {events[events.length - 1].executor && ` (${events[events.length - 1].executor})`}
              </span>
              <span className="text-gray-400">•</span>
            </>
          )}
          <Dialog open={isEventLogOpen} onOpenChange={setIsEventLogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                <List className="h-3 w-3" />
                <span className="text-xs">{events.length} events</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] bg-gradient-to-br from-gray-50 via-white to-gray-50 border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-mono text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Event Stream
                </DialogTitle>
                <DialogDescription className="text-gray-600 font-mono text-xs">
                  Live workflow events • Seq: {lastSequence} • Total: {events.length}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-1.5 max-h-[68vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {events.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 font-mono text-sm">
                    <div className="mb-3 text-2xl">⌛</div>
                    No events yet
                  </div>
                ) : (
                  [...events].reverse().map((event, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded border border-gray-200 hover:border-blue-400 transition-all hover:shadow-md hover:shadow-blue-100 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            #{event.sequence}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            event.type?.includes('completed') ? 'bg-green-100 text-green-700 border border-green-300' :
                            event.type?.includes('failed') ? 'bg-red-100 text-red-700 border border-red-300' :
                            event.type?.includes('started') || event.type?.includes('invoked') ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                            'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {event.type}
                          </span>
                          {event.executor && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 border border-purple-300 font-semibold uppercase tracking-wide">
                              {event.executor}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                          {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.message && (
                        <div className="text-gray-700 text-xs mt-1.5 pl-2 border-l-2 border-blue-300 font-mono leading-relaxed">
                          {event.message}
                        </div>
                      )}
                      {event.data && Object.keys(event.data).length > 0 && (
                        <details className="mt-1.5 group">
                          <summary className="cursor-pointer text-[10px] text-gray-600 hover:text-blue-600 transition-colors font-mono uppercase tracking-wide">
                            → Expand payload
                          </summary>
                          <pre className="mt-1.5 p-2 bg-gray-50 rounded text-[9px] overflow-x-auto border border-gray-200 text-gray-700 font-mono">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 lg:h-[800px]">
          <div className={"lg:col-span-2"}>
            <Card className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                AI Agent Results
              </h2>

              <div className="flex-1 overflow-y-auto">

              {/* Loading cached results indicator */}
              {isLoadingCachedResults && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading analysis results...</p>
                </div>
              )}

              {/* Check when no agents have completed yet, if the financial agent is pending */}
              {!isLoadingCachedResults && workflowStatus === 'running' && allAgentsPending && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Initializing AI agents...</p>
                </div>
              )}

              {/* Check when the workflow failed. Show an error message and ask the user to view the events */}
              {!isLoadingCachedResults && workflowStatus === 'failed' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <>
                  <AlertTriangle className="h-10 w-10 text-red-600 mb-4" />
                  <p className="text-red-600 font-medium mb-2">The analysis workflow has failed.</p>

                  {(events && events.length > 0) ? (
                    <>
                      <p className="text-muted-foreground text-xs mb-4">Please try running the analysis again or check the event log for more details.</p>
                      <Button
                        variant="outline"
                        onClick={() => setIsEventLogOpen(true)}
                      >
                        View Event Log
                      </Button>
                      </>
                   ) : (isCompleted && cachedAnalysisData && cachedAnalysisData.error_details) ? (
                      <p className="text-muted-foreground mb-4">{cachedAnalysisData.error_details.error}</p>
                   ) : () => (<></>)
                  }

                  </>
                </div>
              )}

              {/* Core Analysis Agents */}
              {!isLoadingCachedResults && !allCoreAgentsPending && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Core Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    { Object.entries(agentStatus).filter(([agentName, agent]) => {
                        return (agentName === 'financial_analyst' ||
                                agentName === 'risk_analyst' ||
                                agentName === 'market_analyst' ||
                                agentName === 'compliance_analyst') && (agent.status === 'running' || agent.status === 'completed' || agent.status === 'failed');
                      }).map(([agentName, agent]) => {
                        console.log('Rendering agent:', agentName, agent);
                      return (
                        <div
                          key={agentName}
                          className="p-3 border border-border rounded-lg hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              <div className={`${agent.color} p-1.5 rounded-lg flex-shrink-0`}>
                                <agent.icon className="h-3 w-3 text-white" />
                                
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-xs text-foreground leading-tight">
                                  {agent.displayName}
                                </h3>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className={`w-3 h-3 rounded-full ${getExecutorStatusColor(agent.status)} ${agent.status === 'running' ? 'animate-pulse' : ''}`} />
                            </div>
                          </div>
                          
                          
                          <div className="mb-2">
                            {agent.status === 'running' ? (
                              <div className="flex items-center gap-2 py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-xs text-muted-foreground">Analyzing...</span>
                              </div>
                            ) : (
                              
                              <div>
                                {agent.status === 'failed' ? (
                                  <div className="text-xs text-red-600 font-medium mt-2">
                                    ⚠️ This agent encountered an error during processing.
                                  </div>
                                ) : (agent.status === 'completed' && agent.data && agent.data.executive_summary) ? (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {/* Show first 120 characters of executive summary */}
                                    <ReactMarkdown>
                                      {agent.data.executive_summary.slice(0, 120) + (agent.data.executive_summary.length > 120 ? '...' : '')}
                                    </ReactMarkdown>

                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    No insights extracted.
                                  </div>
                                )}
                              </div>

                            )}
                          </div>


                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={agent.status !== 'completed'}
                              onClick={() => handleExpandAgentReport(agent.name!)}
                              className="text-xs h-6 px-2"
                            >
                              <Expand className="mr-1 h-2.5 w-2.5" />
                              View Report
                            </Button>
                          </div>
                        </div>
                      );
                      // end of return
                    })}
                  </div>
                </div>

              )}

              {/* Perspective Agents */}
              {!isLoadingCachedResults && !allPerspectiveAgentsPending && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Investment Perspectives</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  { Object.entries(agentStatus).filter(([agentName, status]) => {
                      return (agentName === 'investment_supporter' ||
                             agentName === 'investment_challenger') && (status.status === 'running' || status.status === 'completed' || status.status === 'failed');
                    }).map(([agentName, agent]) => {
                    
                    return (
                      <div
                        key={agentName}
                        className="p-3 border border-border rounded-lg hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div className={`${agent.color} p-1.5 rounded-lg flex-shrink-0`}>
                              <agent.icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs text-foreground leading-tight">
                                {agent.displayName}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className={`w-3 h-3 rounded-full ${getExecutorStatusColor(agent.status)} ${agent.status === 'running' ? 'animate-pulse' : ''}`} />
                          </div>
                        </div>
                        
                        <div className="mb-2">
                            {agent.status === 'running' ? (
                              <div className="flex items-center gap-2 py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-xs text-muted-foreground">Analyzing...</span>
                              </div>
                            ) : (
                              <div>
                                {agent.status === 'failed' ? (
                                  <div className="text-xs text-red-600 font-medium mt-2">
                                    ⚠️ This agent encountered an error during processing.
                                  </div>
                                ) : (agentName === 'investment_supporter' && agent.status === 'completed' 
                                     && agent.data && agent.data.investment_supporter) ? (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {/* Show first 120 characters of supporter output */}
                                    <ReactMarkdown>
                                      {agent.data.investment_supporter.slice(0, 120) + (agent.data.investment_supporter.length > 120 ? '...' : '')}
                                    </ReactMarkdown>
                                  </div>
                                ) : (agentName === 'investment_challenger' && agent.status === 'completed' 
                                     && agent.data && agent.data.investment_challenger) ? (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {/* Show first 120 characters of challenger output */}
                                    <ReactMarkdown>
                                      {agent.data.investment_challenger.slice(0, 120) + (agent.data.investment_challenger.length > 120 ? '...' : '')}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    No insights extracted.
                                  </div>
                                )}
                              </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={agent.status !== 'completed'}
                            onClick={() => handleExpandAgentReport(agent.name!)}
                            className="text-xs h-6 px-2"
                          >
                            <Expand className="mr-1 h-2.5 w-2.5" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}


              {/* Summary Agent */}
              {!isLoadingCachedResults && !summaryAgentPending && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Overall Summary</h3>
                <div className="grid grid-cols-1 gap-3">
                  
                  { Object.entries(agentStatus).filter(([agentName, status]) => {
                      return agentName === 'summary_report_generator' && (status.status === 'running' || status.status === 'completed' || status.status === 'failed');
                    }).map(([agentName, agent]) => {

                    return (
                      <div
                        key={agentName}
                        className="p-3 border border-border rounded-lg hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div className={`${agent.color} p-1.5 rounded-lg flex-shrink-0`}>
                              <agent.icon className="h-3 w-3 text-white" />
                              
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs text-foreground leading-tight">
                                {agent.displayName}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className={`w-3 h-3 rounded-full ${getExecutorStatusColor(agent.status)} ${agent.status === 'running' ? 'animate-pulse' : ''}`} />
                          </div>
                        </div>

                        <div className="mb-2">
                            {agent.status === 'running' ? (
                              <div className="flex items-center gap-2 py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-xs text-muted-foreground">Analyzing...</span>
                              </div>
                            ) : (
                              <div>
                                {agent.status === 'failed' ? (
                                  <div className="text-xs text-red-600 font-medium mt-2">
                                    ⚠️ This agent encountered an error during processing.
                                  </div>
                                ) : (agent.status === 'completed' && agent.data && agent.data.summary_report_generator) ? (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {/* Show first 120 characters of executive summary */}
                                    <ReactMarkdown>
                                      {agent.data.summary_report_generator.slice(0, 120) + (agent.data.summary_report_generator.length > 120 ? '...' : '')}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    No insights extracted.
                                  </div>
                                )}
                              </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={agent.status !== 'completed'}
                            onClick={() => handleExpandAgentReport(agent.name!)}
                            className="text-xs h-6 px-2"
                          >
                            <Expand className="mr-1 h-2.5 w-2.5" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}

              </div>
            </Card>
          </div>

          <div className={"lg:col-span-1"}>
            <Card className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                AI Agent Workflow
              </h2>
              <div className="flex-1 h-full overflow-auto">
                <AgentWorkflow agentStatus={agentStatus} workflowStatus={workflowStatus} />
              </div>
            </Card>
          </div>
        </div>
        

        <Dialog open={isAgentDetailOpen} onOpenChange={setIsAgentDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent && (

                <>
                  <div className={`${selectedAgent.color} p-2 rounded-lg`}>
                    <selectedAgent.icon className="h-4 w-4 text-white" />
                  </div>
                  {selectedAgent.displayName}
                </>
              )}
            </DialogTitle>
            <div className="flex items-center justify-between">
              <DialogDescription>
                Complete analysis report and findings
              </DialogDescription>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleCopyToClipboard}
                title={isCopied ? "Copied!" : "Copy to clipboard"}
                className="h-8 w-8"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {selectedAgent && (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {getSelectedAgentDetailReportContent()}
                </pre>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAgentDetailOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
