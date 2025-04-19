import { Handle, Position, NodeProps } from 'reactflow';

export default function StartNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="rounded-full border-2 border-green-600 bg-green-100 w-[100px] h-[100px] flex items-center justify-center shadow-md">
      <div className="text-center">
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-600"
      />
    </div>
  );
} 