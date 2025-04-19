import { Handle, Position, NodeProps } from 'reactflow';

export default function StepNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="rounded-md border-2 border-gray-400 bg-white px-4 py-2 min-w-[150px] shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      
      <div className="text-center">
        <div className="font-bold text-sm mb-1">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500">{data.description}</div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
} 