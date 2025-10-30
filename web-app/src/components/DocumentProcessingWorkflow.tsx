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
import {
  FileText,
  FileType,
  Brain,
  BarChart3,
  FileCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import AgentWorkflowNode from './AgentWorkflowNode';

interface DocumentProcessingWorkflowProps {
  currentStage: number; // 0-4 representing which stage is currently active
}

const DocumentProcessingWorkflow = ({ currentStage }: DocumentProcessingWorkflowProps) => {
  const nodeTypes = useMemo(() => ({ agentNode: AgentWorkflowNode }), []);

  const getNodeStatus = (stageIndex: number) => {
    if (stageIndex < currentStage) return 'complete';
    if (stageIndex === currentStage) return 'processing';
    return 'pending';
  };

  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'agentNode',
      position: { x: 250, y: 0 },
      data: {
        name: 'Text Extraction',
        status: getNodeStatus(0),
        icon: FileText,
        description: 'Extracting text from document',
      },
    },
    {
      id: '2',
      type: 'agentNode',
      position: { x: 250, y: 120 },
      data: {
        name: 'Document Conversion',
        status: getNodeStatus(1),
        icon: FileType,
        description: 'Converting to structured format',
      },
    },
    {
      id: '3',
      type: 'agentNode',
      position: { x: 250, y: 240 },
      data: {
        name: 'Content Analysis',
        status: getNodeStatus(2),
        icon: Brain,
        description: 'Analyzing document content',
      },
    },
    {
      id: '4',
      type: 'agentNode',
      position: { x: 250, y: 360 },
      data: {
        name: 'Data Extraction',
        status: getNodeStatus(3),
        icon: BarChart3,
        description: 'Extracting key data points',
      },
    },
    {
      id: '5',
      type: 'agentNode',
      position: { x: 250, y: 480 },
      data: {
        name: 'Summarization',
        status: getNodeStatus(4),
        icon: FileCheck,
        description: 'Generating summary',
      },
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      animated: currentStage === 0 || currentStage === 1,
      style: { stroke: currentStage >= 1 ? '#22c55e' : '#94a3b8' },
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      animated: currentStage === 1 || currentStage === 2,
      style: { stroke: currentStage >= 2 ? '#22c55e' : '#94a3b8' },
    },
    {
      id: 'e3-4',
      source: '3',
      target: '4',
      animated: currentStage === 2 || currentStage === 3,
      style: { stroke: currentStage >= 3 ? '#22c55e' : '#94a3b8' },
    },
    {
      id: 'e4-5',
      source: '4',
      target: '5',
      animated: currentStage === 3 || currentStage === 4,
      style: { stroke: currentStage >= 4 ? '#22c55e' : '#94a3b8' },
    },
  ];

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-full bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data.status;
            if (status === 'complete') return '#22c55e';
            if (status === 'processing') return '#3b82f6';
            return '#94a3b8';
          }}
          className="bg-card"
        />
      </ReactFlow>
    </div>
  );
};

export default DocumentProcessingWorkflow;
