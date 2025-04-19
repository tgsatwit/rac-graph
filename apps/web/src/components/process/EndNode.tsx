import { Handle, Position, NodeProps } from 'reactflow';

export default function EndNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="rounded-full border-2 border-red-600 bg-red-100 w-[100px] h-[100px] flex items-center justify-center shadow-md">
      <div className="text-center">
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-600"
      />
    </div>
  );
} 