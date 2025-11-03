import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LucideIcon, Loader2 } from 'lucide-react';

interface AgentWorkflowNodeData {
  name: string;
  status: string;
  icon: LucideIcon;
  score?: number;
  isStart?: boolean;
  isFinal?: boolean;
  description?: string;
}

const AgentWorkflowNode = ({ data }: NodeProps<AgentWorkflowNodeData>) => {
  const Icon = data.icon;
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'complete':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-400';
      default:
        return 'bg-yellow-500';
    }
  };
  
  return (
    <div className="px-4 py-3 relative min-w-[200px]">
      <Handle type="target" position={Position.Top} />
      
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {data.status === 'processing' && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
        )}
        <div 
          className={`w-3 h-3 rounded-full ${getStatusColor()}`}
          title={data.status}
        />
      </div>
      
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-6 w-6 text-primary text-xl" />
        <div className="font-semibold text-base text-foreground">{data.name}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-muted-foreground ml-8">
          {data.description}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(AgentWorkflowNode);
