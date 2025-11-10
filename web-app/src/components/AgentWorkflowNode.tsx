import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LucideIcon, Loader2 } from 'lucide-react';

interface AgentWorkflowNodeData {
  name: string;
  status: string;
  icon: LucideIcon;
  isStart?: boolean;
  isFinal?: boolean;
  description?: string;
}

const AgentWorkflowNode = ({ data }: NodeProps<AgentWorkflowNodeData>) => {
  const Icon = data.icon;
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'completed':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-400';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };
  
  return (
    <div className="text-center items-center px-4 py-3 relative min-h-20 min-w-[200px] bg-white border border-gray-400 rounded-lg shadow-sm">
      <Handle type="target" position={Position.Top} />
      
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {data.status === 'running' && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
        )}
        <div 
          className={`w-3 h-3 rounded-full ${getStatusColor()}`}
          title={data.status}
        />
      </div>
      
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-10 w-10 text-primary text-xl font-bold" />
        <div className="font-bold text-foreground text-2xl">{data.name}</div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(AgentWorkflowNode);
