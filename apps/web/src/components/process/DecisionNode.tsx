import { Handle, Position, NodeProps } from 'reactflow';

export default function DecisionNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="rotate-45 border-2 border-yellow-500 bg-yellow-50 w-[100px] h-[100px] flex items-center justify-center shadow-md">
      <div className="-rotate-45 text-center w-full">
        <div className="font-bold text-sm">{data.label}</div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-yellow-500 -rotate-45"
        style={{ left: '50%', top: '-10px' }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 -rotate-45"
        style={{ left: '50%', bottom: '-10px' }}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-500 -rotate-45"
        style={{ left: '-10px', top: '50%' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="maybe"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 -rotate-45"
        style={{ right: '-10px', top: '50%' }}
      />
    </div>
  );
} 