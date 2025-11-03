import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface AgentWorkflowGroupNodeData {
  label: string;
}

const AgentWorkflowGroupNode = ({ data }: NodeProps<AgentWorkflowGroupNodeData>) => {
  return (
    <div className="w-full h-full">
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="absolute -top-6 left-2 text-xl font-semibold text-muted-foreground">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};

export default memo(AgentWorkflowGroupNode);
