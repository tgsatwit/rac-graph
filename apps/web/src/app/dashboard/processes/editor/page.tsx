'use client';

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
import { ProcessModel, ProcessNode, ProcessEdge, ProcessNodeType, UserRole } from 'shared/src/types';
import { generateId } from 'shared/src/utils';
import { UserSession } from '../../../../shared/types/user';

// Import custom node components
import StepNode from '../../../../components/process/StepNode';
import DecisionNode from '../../../../components/process/DecisionNode';
import StartNode from '../../../../components/process/StartNode';
import EndNode from '../../../../components/process/EndNode';
import ControlNode from '../../../../components/process/ControlNode';

// Import toolbar and property panel components
import ProcessToolbar from '../../../../components/process/ProcessToolbar';
import NodePropertiesPanel from '../../../../components/process/NodePropertiesPanel';

// Import collaboration components
import ActiveUsersPanel from '../../../../components/process/ActiveUsersPanel';
import CommentPanel from '../../../../components/process/CommentPanel';
import ActivityLog from '../../../../components/process/ActivityLog';

// Import collaboration functions
import { 
  initializeCollaboration, 
  joinProcess, 
  leaveProcess, 
  subscribeToProcessModel,
  updateProcessModel,
  canEdit
} from '../../../../lib/collaboration';

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
  
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processModel, setProcessModel] = useState<ProcessModel | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  
  // Check if user can edit based on their role
  const userCanEdit = currentUser ? canEdit(currentUser.role) : false;
  
  // Get current user with role when auth user changes
  useEffect(() => {
    // This would be replaced with a real API call
    if (user) {
      // Mock current user with role for now
      setCurrentUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: UserRole.ADMIN // Default for testing
      });
    } else {
      setCurrentUser(null);
    }
  }, [user]);
  
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
          
          // Initialize collaboration
          await initializeCollaboration(newModel.id, newModel, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            role: currentUser.role
          });
        } else {
          // First try to get model from Firebase real-time database
          let modelLoaded = false;
          
          try {
            // Join the process and subscribe to changes
            await joinProcess(processId, {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              role: currentUser.role
            });
            
            // Success, data loaded from real-time database
            modelLoaded = true;
          } catch (error) {
            console.error('Error joining process:', error);
            // Fall back to mock data
          }
          
          if (!modelLoaded) {
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
            
            // Initialize collaboration with the mock data
            await initializeCollaboration(mockModel.id, mockModel, {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              role: currentUser.role
            });
          }
        }
      } catch (error) {
        console.error('Error loading process model:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProcessModel();
    
    // Clean up when unmounting
    return () => {
      if (processId && currentUser && processId !== 'new') {
        leaveProcess(processId, currentUser.uid).catch(console.error);
      }
    };
  }, [processId, processName, currentUser, setNodes, setEdges]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!processModel?.id || !currentUser) return;
    
    const unsubscribe = subscribeToProcessModel(processModel.id, (updatedModel) => {
      // Don't update if we're currently syncing (to avoid loops)
      if (isSyncing) return;
      
      setProcessModel(updatedModel);
      
      // Convert process nodes to React Flow nodes
      const rfNodes = updatedModel.nodes.map(node => {
        // Find existing node to preserve position
        const existingNode = nodes.find(n => n.id === node.id);
        
        return {
          id: node.id,
          type: node.type,
          data: { label: node.label, description: node.description, ...node.properties },
          position: existingNode?.position || { x: 250, y: 100 }, // Default position if not found
        };
      });
      
      // Convert process edges to React Flow edges
      const rfEdges = updatedModel.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label
      }));
      
      setNodes(rfNodes);
      setEdges(rfEdges);
    });
    
    return () => {
      unsubscribe();
    };
  }, [processModel?.id, currentUser, nodes, isSyncing, setNodes, setEdges]);
  
  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!userCanEdit) return;
      
      // Create a unique ID for the new edge
      const edgeId = `e${connection.source}-${connection.target}`;
      setEdges(eds => addEdge({ ...connection, id: edgeId }, eds));
    },
    [setEdges, userCanEdit]
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
      if (!userCanEdit) return;
      
      setNodes(nds =>
        nds.map(node => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
        })
      );
    },
    [setNodes, userCanEdit]
  );
  
  // Update edge properties
  const updateEdgeProperties = useCallback(
    (edgeId: string, label: string) => {
      if (!userCanEdit) return;
      
      setEdges(eds =>
        eds.map(edge => {
          if (edge.id === edgeId) {
            return { ...edge, label };
          }
          return edge;
        })
      );
    },
    [setEdges, userCanEdit]
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
      
      if (!userCanEdit) return;
      
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
    [reactFlowInstance, setNodes, userCanEdit]
  );
  
  // Save the process model
  const saveProcessModel = useCallback(async () => {
    if (!processModel || !currentUser) return;
    
    setIsSaving(true);
    setIsSyncing(true);
    
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
        label: typeof edge.label === 'string' ? edge.label : undefined,
      }));
      
      // Create updated process model
      const updatedModel: ProcessModel = {
        ...processModel,
        nodes: processNodes,
        edges: processEdges,
        updatedBy: currentUser.uid,
        updatedAt: new Date(),
      };
      
      // Update the model in Firebase real-time database
      await updateProcessModel(
        updatedModel.id, 
        updatedModel, 
        currentUser.uid, 
        currentUser.displayName || 'Unknown User'
      );
      
      // Update local state
      setProcessModel(updatedModel);
      
      // Show success message
      alert('Process model saved successfully!');
    } catch (error) {
      console.error('Error saving process model:', error);
      alert('Error saving process model');
    } finally {
      setIsSaving(false);
      setIsSyncing(false);
    }
  }, [processModel, currentUser, nodes, edges]);
  
  // Auto-save changes every 30 seconds if there are changes
  useEffect(() => {
    if (!processModel || !currentUser || !userCanEdit) return;
    
    const autoSaveTimer = setInterval(() => {
      saveProcessModel();
    }, 30000);
    
    return () => {
      clearInterval(autoSaveTimer);
    };
  }, [processModel, currentUser, saveProcessModel, userCanEdit]);
  
  // Handle changes after every node/edge change
  useEffect(() => {
    if (!processModel || !currentUser || isSyncing) return;
    
    const syncChangesWithDatabase = async () => {
      // Only sync changes if we have a valid process model and user
      if (!processModel?.id || !currentUser) return;
      
      // Don't sync changes if we're already syncing
      if (isSyncing) return;
      
      setIsSyncing(true);
      
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
          label: typeof edge.label === 'string' ? edge.label : undefined,
        }));
        
        // Create updated process model
        const updatedModel: ProcessModel = {
          ...processModel,
          nodes: processNodes,
          edges: processEdges,
          updatedBy: currentUser.uid,
          updatedAt: new Date(),
        };
        
        // Only update if there are actual changes
        const hasNodeChanges = JSON.stringify(processModel.nodes) !== JSON.stringify(processNodes);
        const hasEdgeChanges = JSON.stringify(processModel.edges) !== JSON.stringify(processEdges);
        
        if (hasNodeChanges || hasEdgeChanges) {
          // Update the model in Firebase real-time database
          await updateProcessModel(
            updatedModel.id, 
            updatedModel, 
            currentUser.uid, 
            currentUser.displayName || 'Unknown User'
          );
          
          // Update local state
          setProcessModel(updatedModel);
        }
      } catch (error) {
        console.error('Error syncing process model:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    // Debounce the sync to avoid too many updates
    const debounceTimer = setTimeout(() => {
      if (userCanEdit) {
        syncChangesWithDatabase();
      }
    }, 2000);
    
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [nodes, edges, processModel, currentUser, isSyncing, userCanEdit]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading process model...</p>
        </div>
      </div>
    );
  }
  
  // Make sure we have a process model and user
  if (!processModel || !currentUser) {
    return (
      <div className="text-center p-8">
        <p>Error: Process model or user not found.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">{processModel.name}</h1>
          <p className="text-sm text-gray-500">{processModel.description || 'No description'}</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            onClick={() => setShowActivity(!showActivity)}
          >
            {showActivity ? 'Hide Activity' : 'Show Activity'}
          </button>
          
          <button
            className={`px-4 py-2 rounded-md text-sm text-white ${
              isSaving 
                ? 'bg-blue-400 cursor-not-allowed' 
                : userCanEdit 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={saveProcessModel}
            disabled={isSaving || !userCanEdit}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r bg-white p-4 overflow-y-auto flex flex-col">
          <ActiveUsersPanel 
            processId={processModel.id} 
            currentUserId={currentUser.uid} 
          />
          
          <ProcessToolbar />
          
          {showActivity && (
            <div className="mt-4">
              <ActivityLog processId={processModel.id} />
            </div>
          )}
          
          {!userCanEdit && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>View Only Mode</strong>: You don't have permission to edit this process.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex">
          <div ref={reactFlowWrapper} className="flex-1 h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={userCanEdit ? onNodesChange : undefined}
              onEdgesChange={userCanEdit ? onEdgesChange : undefined}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode={userCanEdit ? 'Delete' : null}
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          
          {(selectedNode || selectedEdge) && (
            <div className="w-80 border-l bg-white overflow-y-auto flex flex-col">
              {selectedNode && (
                <div className="p-4">
                  <NodePropertiesPanel
                    node={selectedNode}
                    onChange={userCanEdit ? (newData) => updateNodeProperties(selectedNode.id, newData) : () => {}}
                  />
                </div>
              )}
              
              {selectedEdge && (
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-4">Edge Properties</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Label</label>
                    <input
                      type="text"
                      value={selectedEdge.label?.toString() || ''}
                      onChange={(e) => updateEdgeProperties(selectedEdge.id, e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!userCanEdit}
                    />
                  </div>
                </div>
              )}
              
              <CommentPanel
                processId={processModel.id}
                selectedElement={selectedNode || selectedEdge}
                currentUser={{
                  uid: currentUser.uid,
                  displayName: currentUser.displayName,
                  role: currentUser.role as UserRole
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 