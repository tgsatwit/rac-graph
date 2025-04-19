import { MouseEvent } from 'react';
import { ProcessNodeType } from 'shared/src/types';

export default function ProcessToolbar() {
  const onDragStart = (event: MouseEvent, nodeType: ProcessNodeType) => {
    event.dataTransfer?.setData('application/reactflow/type', nodeType);
    event.dataTransfer?.effectAllowed = 'move';
  };

  return (
    <div className="bg-white border rounded-md p-3 shadow-md">
      <h3 className="font-medium text-sm mb-2">Process Elements</h3>
      <div className="flex flex-col gap-2">
        <div
          className="border border-blue-400 rounded p-2 text-xs bg-blue-50 cursor-grab text-center"
          onDragStart={(event) => onDragStart(event, ProcessNodeType.STEP)}
          draggable
        >
          Process Step
        </div>
        
        <div
          className="border border-yellow-500 rounded p-2 text-xs bg-yellow-50 cursor-grab text-center"
          onDragStart={(event) => onDragStart(event, ProcessNodeType.DECISION)}
          draggable
        >
          Decision
        </div>
        
        <div
          className="border border-green-600 rounded p-2 text-xs bg-green-50 cursor-grab text-center"
          onDragStart={(event) => onDragStart(event, ProcessNodeType.START)}
          draggable
        >
          Start
        </div>
        
        <div
          className="border border-red-600 rounded p-2 text-xs bg-red-50 cursor-grab text-center"
          onDragStart={(event) => onDragStart(event, ProcessNodeType.END)}
          draggable
        >
          End
        </div>
        
        <div
          className="border border-purple-600 rounded p-2 text-xs bg-purple-50 cursor-grab text-center"
          onDragStart={(event) => onDragStart(event, ProcessNodeType.CONTROL)}
          draggable
        >
          Control
        </div>
      </div>
    </div>
  );
} 