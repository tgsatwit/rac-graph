import { ChangeEvent, useCallback } from 'react';
import { Node } from 'reactflow';
import { ProcessNodeType } from 'shared/src/types';

interface NodePropertiesPanelProps {
  node: Node;
  onChange: (newData: any) => void;
}

export default function NodePropertiesPanel({ node, onChange }: NodePropertiesPanelProps) {
  const updateNodeData = useCallback(
    (key: string, value: any) => {
      onChange({ ...node.data, [key]: value });
    },
    [node, onChange]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      updateNodeData(name, value);
    },
    [updateNodeData]
  );

  // Node type specific properties
  const renderTypeSpecificProperties = () => {
    switch (node.type) {
      case ProcessNodeType.DECISION:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Default Path</label>
              <select
                name="defaultPath"
                value={node.data.defaultPath || 'yes'}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
              </select>
            </div>
          </>
        );
      case ProcessNodeType.CONTROL:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Control Type</label>
              <select
                name="controlType"
                value={node.data.controlType || 'detective'}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="preventive">Preventive</option>
                <option value="detective">Detective</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Effectiveness</label>
              <select
                name="effectiveness"
                value={node.data.effectiveness || 'medium'}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Node Properties</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Type</label>
        <div className="p-2 bg-gray-100 rounded">{node.type}</div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Label</label>
        <input
          type="text"
          name="label"
          value={node.data.label || ''}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={node.data.description || ''}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>
      
      {renderTypeSpecificProperties()}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Node ID</label>
        <div className="p-2 bg-gray-100 rounded text-xs font-mono">{node.id}</div>
      </div>
    </div>
  );
} 