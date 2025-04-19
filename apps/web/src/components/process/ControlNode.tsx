import { Handle, Position, NodeProps } from 'reactflow';

export default function ControlNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="rounded-md border-2 border-purple-600 bg-purple-50 px-4 py-2 min-w-[150px] flex flex-col items-center shadow-md">
      <div className="flex items-center justify-center mb-2">
        <span className="text-xs bg-purple-600 text-white rounded px-2 py-0.5">Control</span>
      </div>
      
      <div className="text-center">
        <div className="font-bold text-sm mb-1">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500">{data.description}</div>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-600"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-600"
      />
    </div>
  );
} 