import { useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { BarChart3, AlertTriangle, TrendingUp, CheckCircle, Brain, ThumbsUp, ThumbsDown, HardDriveDownload, Gavel } from 'lucide-react';
import AgentWorkflowNode from '@/components/AgentWorkflowNode';
import AgentWorkflowGroupNode from '@/components/AgentWorkflowGroupNode';

interface AgentStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  name?: string;
  displayName?: string;
  icon?: any;
  color?: string;
  score?: number;
  insights?: string[];
  result?: any;
}

interface AgentWorkflowProps {
  agentStatus?: Record<string, AgentStatus>;
  workflowStatus?: 'idle' | 'running' | 'completed' | 'failed';
}

const AgentWorkflow = ({ agentStatus, workflowStatus }: AgentWorkflowProps) => {
  // Helper function to map agent status to node status
  const mapAgentStatusToNodeStatus = (status: string): string => {
    switch (status) {
      case 'running':
        return 'processing';
      case 'completed':
        return 'complete';
      case 'failed':
        return 'failed';
      case 'pending':
      default:
        return 'pending';
    }
  };

  // Helper function to get agent icon
  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'financial': return BarChart3;
      case 'risk': return AlertTriangle;
      case 'market': return TrendingUp;
      case 'compliance': return Gavel;
      case 'supporter': return ThumbsUp;
      case 'challenger': return ThumbsDown;
      case 'summary': return Brain;
      default: return CheckCircle;
    }
  };

  const agentData = [
    {
      id: "start",
      name: "Prepare Data",
      status: workflowStatus === 'idle' ? 'pending' : 'complete',
      icon: HardDriveDownload,
      position: { x: 550, y: -400 },
    },
    {
      id: "financial",
      name: "Financial Analysis",
      status: agentStatus?.financial ? mapAgentStatusToNodeStatus(agentStatus.financial.status) : 'pending',
      icon: BarChart3,
      score: agentStatus?.financial?.score,
      position: { x: 50, y: -250 },
    },
    {
      id: "risk",
      name: "Risk Assessment",
      status: agentStatus?.risk ? mapAgentStatusToNodeStatus(agentStatus.risk.status) : 'pending',
      icon: AlertTriangle,
      score: agentStatus?.risk?.score,
      position: { x: 200, y: -100 },
    },
    {
      id: "market",
      name: "Market Analysis",
      status: agentStatus?.market ? mapAgentStatusToNodeStatus(agentStatus.market.status) : 'pending',
      icon: TrendingUp,
      score: agentStatus?.market?.score,
      position: { x: 350, y: 50 },
    },
    {
      id: "compliance",
      name: "Compliance Check",
      status: agentStatus?.compliance ? mapAgentStatusToNodeStatus(agentStatus.compliance.status) : 'pending',
      icon: Gavel,
      score: agentStatus?.compliance?.score,
      position: { x: 500, y: 200 },
    },
    {
      id: "debate-group",
      name: "Investment Debate",
      status: (agentStatus?.supporter?.status === 'completed' && agentStatus?.challenger?.status === 'completed') 
        ? 'complete' 
        : (agentStatus?.supporter?.status === 'running' || agentStatus?.challenger?.status === 'running')
        ? 'processing'
        : 'pending',
      icon: Brain,
      position: { x: 50, y: 350 },
      isGroup: true,
    },
    {
      id: "supporter",
      name: "Supporter Agent",
      status: agentStatus?.supporter ? mapAgentStatusToNodeStatus(agentStatus.supporter.status) : 'pending',
      icon: ThumbsUp,
      position: { x: 20, y: 40 },
      parentNode: "debate-group",
    },
    {
      id: "challenger",
      name: "Challenger Agent",
      status: agentStatus?.challenger ? mapAgentStatusToNodeStatus(agentStatus.challenger.status) : 'pending',
      icon: ThumbsDown,
      position: { x: 340, y: 40 },
      parentNode: "debate-group",
    },
    {
      id: "final",
      name: "Final Report",
      status: agentStatus?.summary ? mapAgentStatusToNodeStatus(agentStatus.summary.status) : 'pending',
      icon: Brain,
      position: { x: 190, y: 600 },
    },
  ];

  const nodeTypes = useMemo(() => ({ 
    agentNode: AgentWorkflowNode,
    groupNode: AgentWorkflowGroupNode,
  }), []);

  const createNodesFromAgentData = () => 
    agentData.map((agent) => {
      const isStart = agent.id === 'start';
      const isFinal = agent.id === 'final';
      const isGroup = agent.isGroup || false;
      
      if (isGroup) {
        return {
          id: agent.id,
          type: 'groupNode',
          position: agent.position,
          data: {
            label: agent.name,
          },
          style: {
            background: 'hsl(var(--accent) / 0.3)',
            border: '2px dashed hsl(var(--border))',
            borderRadius: '12px',
            width: 560,
            height: 160,
            padding: 15,
          },
        };
      }
      
      return {
        id: agent.id,
        type: 'agentNode',
        position: agent.position,
        parentNode: agent.parentNode,
        extent: agent.parentNode ? ('parent' as const) : undefined,
        data: {
          name: agent.name,
          status: agent.status,
          icon: agent.icon,
          score: agent.score,
          isStart,
          isFinal,
        },
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          width: isStart || isFinal ? 280 : 200,
          height: 'auto',
        },
      };
    });

  const initialNodes: Node[] = useMemo(() => createNodesFromAgentData(), []);

  const initialEdges: Edge[] = useMemo(() => [
    { id: 'e-start-financial', source: 'start', target: 'financial', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-start-risk', source: 'start', target: 'risk', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-start-market', source: 'start', target: 'market', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-start-compliance', source: 'start', target: 'compliance', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    
    { id: 'e-financial-debate', source: 'financial', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-risk-debate', source: 'risk', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-market-debate', source: 'market', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-compliance-debate', source: 'compliance', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },

    { id: 'e-supporter-challenger', source: 'supporter', target: 'challenger', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-challenger-supporter', source: 'challenger', target: 'supporter', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    
    { id: 'e-debate-final', source: 'debate-group', target: 'final', animated: true, style: { stroke: 'hsl(var(--primary))' } },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes whenever agentStatus or workflowStatus changes
  useEffect(() => {
    const updatedNodes = createNodesFromAgentData();
    setNodes(updatedNodes);
  }, [agentStatus, workflowStatus]);

  return (
    <div className="w-full h-full bg-card border border-border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => 'hsl(var(--primary))'}
          maskColor="hsl(var(--accent) / 0.8)"
          style={{ width: 100, height: 75 }}
        />
      </ReactFlow>
    </div>
  );
};

export default AgentWorkflow;
