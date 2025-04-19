'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  useReactFlow,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '../../../../contexts/AuthContext';
import { ProcessModel, ProcessNode, ProcessEdge, ProcessNodeType } from 'shared/src/types';
import { generateId } from 'shared/src/utils';

// Import custom node components
import StepNode from '../../../../components/process/StepNode';
import DecisionNode from '../../../../components/process/DecisionNode';
import StartNode from '../../../../components/process/StartNode';
import EndNode from '../../../../components/process/EndNode';
import ControlNode from '../../../../components/process/ControlNode';

// Import toolbar and property panel components
import ProcessToolbar from '../../../../components/process/ProcessToolbar';
import NodePropertiesPanel from '../../../../components/process/NodePropertiesPanel';

// Custom node types mapping
const nodeTypes: NodeTypes = {
  [ProcessNodeType.STEP]: StepNode,
  [ProcessNodeType.DECISION]: DecisionNode,
  [ProcessNodeType.START]: StartNode,
  [ProcessNodeType.END]: EndNode,
  [ProcessNodeType.CONTROL]: ControlNode,
};

export default function ProcessEditorPage() {
  const searchParams = useSearchParams();
  const processId = searchParams.get('id');
  const processName = searchParams.get('name') || 'New Process';
  
  const { currentUser } = useAuth();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processModel, setProcessModel] = useState<ProcessModel | null>(null);
  
  // Load process model data
  useEffect(() => {
    const loadProcessModel = async () => {
      if (!processId || !currentUser) return;
      
      setIsLoading(true);
      try {
        if (processId === 'new') {
          // Create a new process model
          const newModel: ProcessModel = {
            id: generateId(),
            name: processName,
            description: '',
            nodes: [
              {
                id: generateId(),
                type: ProcessNodeType.START,
                label: 'Start',
              },
              {
                id: generateId(),
                type: ProcessNodeType.END,
                label: 'End',
              },
            ],
            edges: [],
            version: 1,
            createdBy: currentUser.uid,
            updatedBy: currentUser.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setProcessModel(newModel);
          
          // Convert process nodes to React Flow nodes
          const rfNodes = newModel.nodes.map((node, index) => ({
            id: node.id,
            type: node.type,
            data: { label: node.label, description: node.description, ...node.properties },
            position: { x: 250 * index, y: 100 },
          }));
          
          setNodes(rfNodes);
        } else {
          // TODO: Fetch existing process model from API
          // For now using mock data
          const mockModel: ProcessModel = {
            id: processId,
            name: 'Sample Process',
            description: 'A sample process model',
            nodes: [
              {
                id: '1',
                type: ProcessNodeType.START,
                label: 'Start',
              },
              {
                id: '2',
                type: ProcessNodeType.STEP,
                label: 'Process Application',
                description: 'Process the customer application',
              },
              {
                id: '3',
                type: ProcessNodeType.DECISION,
                label: 'Approved?',
              },
              {
                id: '4',
                type: ProcessNodeType.STEP,
                label: 'Send Approval',
              },
              {
                id: '5',
                type: ProcessNodeType.STEP,
                label: 'Send Rejection',
              },
              {
                id: '6',
                type: ProcessNodeType.END,
                label: 'End',
              },
            ],
            edges: [
              { id: 'e1-2', source: '1', target: '2', label: '' },
              { id: 'e2-3', source: '2', target: '3', label: '' },
              { id: 'e3-4', source: '3', target: '4', label: 'Yes' },
              { id: 'e3-5', source: '3', target: '5', label: 'No' },
              { id: 'e4-6', source: '4', target: '6', label: '' },
              { id: 'e5-6', source: '5', target: '6', label: '' },
            ],
            version: 1,
            createdBy: 'user1',
            updatedBy: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setProcessModel(mockModel);
          
          // Convert process nodes to React Flow nodes
          const rfNodes = mockModel.nodes.map((node, index) => ({
            id: node.id,
            type: node.type,
            data: { label: node.label, description: node.description, ...node.properties },
            position: { x: 250, y: 100 + index * 100 },
          }));
          
          // Convert process edges to React Flow edges
          const rfEdges = mockModel.edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
          }));
          
          setNodes(rfNodes);
          setEdges(rfEdges);
        }
      } catch (error) {
        console.error('Error loading process model:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProcessModel();
  }, [processId, processName, currentUser, setNodes, setEdges]);
  
  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Create a unique ID for the new edge
      const edgeId = `e${connection.source}-${connection.target}`;
      setEdges(eds => addEdge({ ...connection, id: edgeId }, eds));
    },
    [setEdges]
  );
  
  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);
  
  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);
  
  // Handle pane click (deselect everything)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);
  
  // Update node properties
  const updateNodeProperties = useCallback(
    (nodeId: string, newData: any) => {
      setNodes(nds =>
        nds.map(node => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );
  
  // Update edge properties
  const updateEdgeProperties = useCallback(
    (edgeId: string, label: string) => {
      setEdges(eds =>
        eds.map(edge => {
          if (edge.id === edgeId) {
            return { ...edge, label };
          }
          return edge;
        })
      );
    },
    [setEdges]
  );
  
  // Handle drag over for adding new nodes
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop for adding new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow/type') as ProcessNodeType;
      
      if (!nodeType || !reactFlowBounds || !reactFlowInstance) {
        return;
      }
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      });
      
      const newNodeId = generateId();
      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position,
        data: { label: `New ${nodeType}` },
      };
      
      setNodes(nds => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );
  
  // Save the process model
  const saveProcessModel = useCallback(async () => {
    if (!processModel || !currentUser) return;
    
    setIsSaving(true);
    try {
      // Convert React Flow nodes to process nodes
      const processNodes: ProcessNode[] = nodes.map(node => ({
        id: node.id,
        type: node.type as ProcessNodeType,
        label: node.data.label,
        description: node.data.description,
        properties: { ...node.data },
      }));
      
      // Convert React Flow edges to process edges
      const processEdges: ProcessEdge[] = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
      }));
      
      // Create updated process model
      const updatedModel: ProcessModel = {
        ...processModel,
        nodes: processNodes,
        edges: processEdges,
        updatedBy: currentUser.uid,
        updatedAt: new Date(),
      };
      
      // TODO: Save to backend via API
      console.log('Saving process model:', updatedModel);
      
      // Update local state
      setProcessModel(updatedModel);
      
      // Show success message
      alert('Process model saved successfully!');
    } catch (error) {
      console.error('Error saving process model:', error);
      alert('Error saving process model');
    } finally {
      setIsSaving(false);
    }
  }, [processModel, currentUser, nodes, edges]);
  
  // Validate the process model
  const validateProcessModel = useCallback(() => {
    if (!nodes.length) {
      return { valid: false, message: 'Process model must have at least one node' };
    }
    
    // Check if there is exactly one start node
    const startNodes = nodes.filter(node => node.type === ProcessNodeType.START);
    if (startNodes.length === 0) {
      return { valid: false, message: 'Process model must have a Start node' };
    }
    if (startNodes.length > 1) {
      return { valid: false, message: 'Process model must have exactly one Start node' };
    }
    
    // Check if there is at least one end node
    const endNodes = nodes.filter(node => node.type === ProcessNodeType.END);
    if (endNodes.length === 0) {
      return { valid: false, message: 'Process model must have at least one End node' };
    }
    
    // Check for nodes without connections
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const disconnectedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
    if (disconnectedNodes.length > 0) {
      return { 
        valid: false, 
        message: `There are ${disconnectedNodes.length} disconnected nodes in the process model` 
      };
    }
    
    return { valid: true, message: 'Process model is valid' };
  }, [nodes, edges]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading process editor...</div>;
  }
  
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">{processModel?.name || 'Process Editor'}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const validation = validateProcessModel();
              alert(validation.message);
            }}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Validate
          </button>
          <button
            onClick={saveProcessModel}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Process'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div ref={reactFlowWrapper} className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-left">
              <ProcessToolbar />
            </Panel>
          </ReactFlow>
        </div>
        
        {selectedNode && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <NodePropertiesPanel
              node={selectedNode}
              onChange={(newData) => updateNodeProperties(selectedNode.id, newData)}
            />
          </div>
        )}
        
        {selectedEdge && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edge Properties</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                type="text"
                value={selectedEdge.label || ''}
                onChange={(e) => updateEdgeProperties(selectedEdge.id, e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 