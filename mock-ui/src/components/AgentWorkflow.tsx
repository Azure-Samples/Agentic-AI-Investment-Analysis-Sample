import { useMemo } from 'react';
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
import { BarChart3, AlertTriangle, TrendingUp, CheckCircle, Brain, ThumbsUp, ThumbsDown } from 'lucide-react';
import AgentWorkflowNode from './AgentWorkflowNode';
import AgentWorkflowGroupNode from './AgentWorkflowGroupNode';

const AgentWorkflow = () => {
  const agentData = [
    {
      id: "start",
      name: "Document Upload",
      status: "complete",
      icon: Brain,
      position: { x: 250, y: 0 },
    },
    {
      id: "financial",
      name: "Financial Analysis",
      status: "complete",
      icon: BarChart3,
      score: 78,
      position: { x: 50, y: 200 },
    },
    {
      id: "risk",
      name: "Risk Assessment",
      status: "complete",
      icon: AlertTriangle,
      score: 65,
      position: { x: 205, y: 200 },
    },
    {
      id: "market",
      name: "Market Analysis",
      status: "complete",
      icon: TrendingUp,
      score: 82,
      position: { x: 360, y: 200 },
    },
    {
      id: "compliance",
      name: "Compliance Check",
      status: "complete",
      icon: CheckCircle,
      score: 90,
      position: { x: 515, y: 200 },
    },
    {
      id: "debate-group",
      name: "Debate Analysis",
      status: "complete",
      icon: Brain,
      position: { x: 200, y: 400 },
      isGroup: true,
    },
    {
      id: "supporter",
      name: "Supporter Agent",
      status: "complete",
      icon: ThumbsUp,
      position: { x: 20, y: 40 },
      parentNode: "debate-group",
    },
    {
      id: "challenger",
      name: "Challenger Agent",
      status: "complete",
      icon: ThumbsDown,
      position: { x: 190, y: 40 },
      parentNode: "debate-group",
    },
    {
      id: "final",
      name: "Final Report",
      status: "complete",
      icon: Brain,
      position: { x: 280, y: 600 },
    },
  ];

  const nodeTypes = useMemo(() => ({ 
    agentNode: AgentWorkflowNode,
    groupNode: AgentWorkflowGroupNode,
  }), []);

  const initialNodes: Node[] = useMemo(() => 
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
            width: 360,
            height: 140,
            padding: 20,
          },
        };
      }
      
      return {
        id: agent.id,
        type: 'agentNode',
        position: agent.position,
        parentNode: agent.parentNode,
        extent: agent.parentNode ? 'parent' : undefined,
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
          width: isStart || isFinal ? 200 : 150,
        },
      };
    }), []);

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
        minZoom={0.1}
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
