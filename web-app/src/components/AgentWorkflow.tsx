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
    data?: any;
    extractedResult?: string[];
}

interface AgentWorkflowProps {
  agentStatus?: Record<string, AgentStatus>;
  workflowStatus?: 'idle' | 'running' | 'completed' | 'failed';
}

const AgentWorkflow = ({ agentStatus, workflowStatus }: AgentWorkflowProps) => {
  
  const agentData = [
    {
      id: "data_prepper",
      name: "Prepare Data",
      status: agentStatus['data_prepper'] ? agentStatus['data_prepper'].status : 'pending',
      icon: HardDriveDownload,
      position: { x: 550, y: -400 },
    },
    {
      id: "financial_analyst",
      name: "Financial Analyst",
      status: agentStatus['financial_analyst'] ? agentStatus['financial_analyst'].status : 'pending',
      icon: BarChart3,
      position: { x: 50, y: -250 },
    },
    {
      id: "risk_analyst",
      name: "Risk Analyst",
      status: agentStatus['risk_analyst'] ? agentStatus['risk_analyst'].status : 'pending',
      icon: AlertTriangle,
      position: { x: 200, y: -100 },
    },
    {
      id: "market_analyst",
      name: "Market Strategy Analyst",
      status: agentStatus['market_analyst'] ? agentStatus['market_analyst'].status : 'pending',
      icon: TrendingUp,
      position: { x: 350, y: 50 },
    },
    {
      id: "compliance_analyst",
      name: "Compliance Analyst",
      status: agentStatus['compliance_analyst'] ? agentStatus['compliance_analyst'].status : 'pending',
      icon: Gavel,
      position: { x: 500, y: 200 },
    },
    {
      id: "debate-group",
      name: "Investment Debate",
      status: (agentStatus['investment_supporter']?.status === 'completed' && agentStatus['investment_challenger']?.status === 'completed') 
        ? 'complete'
        : (agentStatus['investment_supporter']?.status === 'running' || agentStatus['investment_challenger']?.status === 'running')
        ? 'processing'
        : 'pending',
      icon: Brain,
      position: { x: 50, y: 350 },
      isGroup: true,
    },
    {
      id: "investment_supporter",
      name: "Supporter Agent",
      status: agentStatus['investment_supporter'] ? agentStatus['investment_supporter'].status : 'pending',
      icon: ThumbsUp,
      position: { x: 20, y: 40 },
      parentNode: "debate-group",
    },
    {
      id: "investment_challenger",
      name: "Challenger Agent",
      status: agentStatus['investment_challenger'] ? agentStatus['investment_challenger'].status : 'pending',
      icon: ThumbsDown,
      position: { x: 340, y: 40 },
      parentNode: "debate-group",
    },
    {
      id: "summary_report_generator",
      name: "Summary Report",
      status: agentStatus['summary_report_generator'] ? agentStatus['summary_report_generator'].status : 'pending',
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
      const isStart = agent.id === 'data_prepper';
      const isFinal = agent.id === 'summary_report_generator';
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
    { id: 'e-data_prepper-financial', source: 'data_prepper', target: 'financial_analyst', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-data_prepper-risk', source: 'data_prepper', target: 'risk_analyst', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-data_prepper-market', source: 'data_prepper', target: 'market_analyst', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-data_prepper-compliance', source: 'data_prepper', target: 'compliance_analyst', animated: true, style: { stroke: 'hsl(var(--primary))' } },

    { id: 'e-financial-debate', source: 'financial_analyst', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-risk-debate', source: 'risk_analyst', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-market-debate', source: 'market_analyst', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-compliance-debate', source: 'compliance_analyst', target: 'debate-group', animated: true, style: { stroke: 'hsl(var(--primary))' } },

    { id: 'e-supporter-challenger', source: 'investment_supporter', target: 'investment_challenger', animated: true, style: { stroke: 'hsl(var(--primary))' } },
    { id: 'e-challenger-supporter', source: 'investment_challenger', target: 'investment_supporter', animated: true, style: { stroke: 'hsl(var(--primary))' } },

    { id: 'e-debate-summary', source: 'debate-group', target: 'summary_report_generator', animated: true, style: { stroke: 'hsl(var(--primary))' } },
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
