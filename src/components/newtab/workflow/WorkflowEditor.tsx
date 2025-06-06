import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  Panel,
  Node,
  Edge,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesDelete,
  OnEdgesDelete,
  OnConnect,
  OnEdgeUpdateFunc,
} from 'reactflow';
import React, { useState as useReactState } from 'react'; // aliasing to avoid conflict if component uses 'useState'
import React, { useState as useReactState } from 'react'; // aliasing to avoid conflict if component uses 'useState'
import 'reactflow/dist/style.css';
import EditorCustomEdge from './editor/EditorCustomEdge';
import BlockNote from '../../block/BlockNote';
import BlockBasic from '../../block/BlockBasic';
import BlockDelay from '../../block/BlockDelay';
import BlockConditions from '../../block/BlockConditions';
import BlockElementExists from '../../block/BlockElementExists';
import BlockGroup from '../../block/BlockGroup';
import BlockGroup2 from '../../block/BlockGroup2';
import BlockLoopBreakpoint from '../../block/BlockLoopBreakpoint';
import BlockPackage from '../../block/BlockPackage'; // Import BlockPackage
import BlockRepeatTask from '../../block/BlockRepeatTask'; // Import BlockRepeatTask
import EditBlockSettings from './edit/EditBlockSettings';
import EditorSearchBlocks from './editor/EditorSearchBlocks';

// Define a more specific type for node data that includes callbacks
export interface NodeData {
  label?: string;
  [key: string]: any; // Allow other data properties
  // Callbacks that custom nodes might need
  onUpdateData?: (nodeId: string, data: any) => void;
  onDelete?: (nodeId: string) => void;
  onSettings?: (nodeId: string) => void; // Example for settings
}


// Placeholder for block definitions - in a real app, this would come from a registry or API
const blockDefinitions: Record<string, any> = {
  'BlockNote': { id: 'BlockNote', name: 'Note', icon: 'riFileEditLine', category: { color: 'bg-yellow-200' } },
  'BlockBasic': { id: 'BlockBasic', name: 'Basic Block', icon: 'riGlobalLine', category: { color: 'bg-blue-200' } }, // Default definition
  'trigger': { id: 'trigger', name: 'Trigger', icon: 'riPlayCircleLine', category: { color: 'bg-green-200' } },
  'get-variable': { id: 'get-variable', name: 'Get Variable', icon: 'riCodeBoxLine', category: { color: 'bg-purple-200' } },
  'BlockDelay': { id: 'BlockDelay', name: 'Delay', icon: 'riTimerLine', category: { color: 'bg-orange-200' } },
  'conditions': { id: 'conditions', name: 'Conditions', icon: 'riAB', category: { color: 'bg-purple-300' } },
  'element-exists': { id: 'element-exists', name: 'Element Exists', icon: 'riFocus3Line', category: { color: 'bg-teal-300' } },
  'forms': { id: 'forms', name: 'Forms', icon: 'riInputMethodLine', category: { color: 'bg-indigo-300' } },
  'event-click': { id: 'event-click', name: 'Click Event', icon: 'riMouseLine', category: { color: 'bg-pink-300' } },
  // Definitions for the new blocks
  'blocks-group': { id: 'blocks-group', name: 'Workflow Group', icon: 'riFolderZipLine', category: { color: 'bg-gray-400' } },
  'group': { id: 'group', name: 'Group', icon: 'riCheckboxMultipleBlankLine', category: { color: 'bg-blue-300' } },
  'loop-breakpoint': { id: 'loop-breakpoint', name: 'Loop Breakpoint', icon: 'riStopLine', category: { color: 'bg-red-300' } },
  'package': { id: 'package', name: 'Package', icon: 'riBox3Line', category: { color: 'bg-green-300' } },
  'repeat-task': { id: 'repeat-task', name: 'Repeat Task', icon: 'riRepeat2Line', category: { color: 'bg-indigo-300' } },
};


const nodeTypes = {
  'custom-node': BlockBasic, // Default to BlockBasic for unknown types
  BlockNote: BlockNote,
  BlockBasic: BlockBasic, // Used for default and various specific types
  BlockDelay: BlockDelay,
  BlockConditions: BlockConditions,
  BlockElementExists: BlockElementExists,
  BlockGroup: BlockGroup,
  BlockGroup2: BlockGroup2,
  BlockLoopBreakpoint: BlockLoopBreakpoint,
  BlockPackage: BlockPackage,
  BlockRepeatTask: BlockRepeatTask,
  // Map Vue block IDs (props.label in Vue or data.id) to React components
  'trigger': BlockBasic, // Keep existing mappings
  'get-variable': BlockBasic,
  'delay': BlockDelay,
  'conditions': BlockConditions,
  'element-exists': BlockElementExists,
  'forms': BlockBasic,
  'event-click': BlockBasic,
  'blocks-group': BlockGroup,
  'group': BlockGroup2,
  'loop-breakpoint': BlockLoopBreakpoint,
  'package': BlockPackage,
  'repeat-task': BlockRepeatTask,
  // ... other specific block types
};

const edgeTypes = {
  'custom-edge': EditorCustomEdge,
  // Future: Can add more edge types if needed
};

interface WorkflowEditorProps {
  id?: string;
  data?: { x: number; y: number; zoom: number; nodes: Node[]; edges: Edge[] };
  options?: any;
  editorControls?: boolean;
  minimap?: boolean;
  disabled?: boolean;
  onEdit?: (params: any) => void;
  onInit?: (reactFlowInstance: any) => void;
  onUpdateNode?: (node: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onUpdateSettings?: (params: any) => void;
  controlsPrepend?: React.ReactNode;
  controlsAppend?: React.ReactNode;
}

const FlowCanvas: React.FC<WorkflowEditorProps> = (props) => {
  const { fitView, zoomIn, zoomOut, project, getNodes, getEdges, updateEdge: rfUpdateEdge } = useReactFlow();
  const { fitView, zoomIn, zoomOut, project, getNodes, getEdges, updateEdge: rfUpdateEdge, setNodes: setReactFlowNodes } = useReactFlow();
  // Ensure Node generic type includes our NodeData for type safety with custom nodes
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node<NodeData>[]>([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<Edge[]>([]);

  // Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useReactState(false);
  const [currentBlockForSettings, setCurrentBlockForSettings] = useReactState<Node<NodeData> | null>(null);


  // Callbacks for custom nodes, passed via node.data
  const handleUpdateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
    // Also inform the parent/store if needed
    const updatedNode = getNodes().find(n => n.id === nodeId);
    if (updatedNode && props.onUpdateNode) {
        props.onUpdateNode({ ...updatedNode, data: { ...updatedNode.data, ...newData } });
    }
  }, [setNodes, getNodes, props.onUpdateNode]);

  const handleDeleteNodeCallback = useCallback((nodeId: string) => {
    // This will trigger onNodesDelete internally if node is deleted via React Flow
    // If called from custom node UI, we might need to manually remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    if (props.onDeleteNode) {
      props.onDeleteNode(nodeId);
    }
  }, [setNodes, props.onDeleteNode]);

  const handleOpenSettingsModal = useCallback((node: Node<NodeData>) => {
    setCurrentBlockForSettings(node);
    setIsSettingsModalOpen(true);
  }, []);

  const handleSaveSettings = useCallback(({ settings, onError }: { settings?: any; onError?: any }) => {
    if (currentBlockForSettings) {
      const updatedNodeData = {
        ...currentBlockForSettings.data,
        ...(settings && { settings }),
        ...(onError && { onError }),
      };
      handleUpdateNodeData(currentBlockForSettings.id, updatedNodeData);

      // Also call the prop for external updates if provided
      if (props.onUpdateSettings) {
        props.onUpdateSettings({
          blockId: currentBlockForSettings.id,
          settings,
          onError,
        });
      }
    }
    setIsSettingsModalOpen(false);
    setCurrentBlockForSettings(null);
  }, [currentBlockForSettings, handleUpdateNodeData, props.onUpdateSettings]);


  React.useEffect(() => {
    const initialNodes = (props.data?.nodes || []).map((vueNode): Node<NodeData> => {
      // Determine React node type based on Vue node's properties (e.g., vueNode.label or vueNode.id)
      // vueNode.label in the old system was often the block's type ID like 'trigger', 'delay', etc.
      // It can also be the node's actual custom name if set by user.
      // vueNode.id was the unique instance ID.
      // vueNode.data.id was the block type definition ID (e.g. 'forms', 'trigger'). This is most reliable for type mapping.

      let blockDefId = vueNode.data?.id || vueNode.label || vueNode.id; // Best guess for definition key
      let reactNodeType = blockDefId;

      // Explicit mappings based on the original Vue component names or known IDs
      if (blockDefId === 'note') reactNodeType = 'BlockNote';
      else if (blockDefId === 'delay') reactNodeType = 'BlockDelay';
      else if (blockDefId === 'conditions') reactNodeType = 'BlockConditions';
      else if (blockDefId === 'element-exists') reactNodeType = 'BlockElementExists';
      else if (blockDefId === 'blocks-group') reactNodeType = 'BlockGroup';
      else if (blockDefId === 'group') reactNodeType = 'BlockGroup2';
      else if (blockDefId === 'loop-breakpoint') reactNodeType = 'BlockLoopBreakpoint';
      else if (blockDefId === 'package') reactNodeType = 'BlockPackage';
      else if (blockDefId === 'repeat-task') reactNodeType = 'BlockRepeatTask';
      else if (['forms', 'event-click' /* add other BlockBasicWithFallback types here */].includes(blockDefId)) {
        reactNodeType = 'BlockBasic';
      }
      else if (!nodeTypes[reactNodeType]) {
        console.warn(`Vue Node type "${reactNodeType}" (blockDefId: ${blockDefId}, vueNode.id: ${vueNode.id}) is not explicitly in nodeTypes. Defaulting to BlockBasic.`);
        reactNodeType = 'BlockBasic';
      }

      if (!nodeTypes[reactNodeType]) {
        reactNodeType = 'custom-node'; // custom-node is typically BlockBasic
      }

      const blockDefinition = blockDefinitions[blockDefId] || blockDefinitions[reactNodeType] || blockDefinitions['BlockBasic'];

      const initialData = { ...(vueNode.data || {}) };
      if (['forms', 'event-click'].includes(blockDefId) && reactNodeType === 'BlockBasic') {
        if (!initialData.onError) initialData.onError = {};
        initialData.onError.enable = true;
        initialData.onError.toDo = 'fallback';
      }

      // Placeholder store functions for BlockPackage
      // In a real app, these would come from a context or a proper store instance
      const placeholderPackageStore = {
        isPackageInstalled: (packageId: string) => { console.log(`isPackageInstalled(${packageId}) check`); return false; },
        installPackage: async (pkgData: any) => { console.log('installPackage called', pkgData); },
        updateInternalPackage: async (pkgData: any) => { console.log('updateInternalPackage called', pkgData); return null; },
      };

      const reactFlowNode: Node<NodeData> = {
        id: vueNode.id,
        type: reactNodeType,
        position: vueNode.position || { x: (vueNode as any).x || 0, y: (vueNode as any).y || 0 },
        data: {
          ...initialData,
          label: initialData.label || vueNode.label || vueNode.id,
          blockDefinition: blockDefinition,
          onUpdateData: (newData) => handleUpdateNodeData(vueNode.id, newData),
          onDelete: () => handleDeleteNodeCallback(vueNode.id),
          onSettings: () => handleOpenSettingsModal({ id: vueNode.id, type: reactNodeType, data: initialData, position: vueNode.position } as Node<NodeData>),
          ...(reactNodeType === 'BlockGroup' && {
            onEditGroupItem: (item) => console.log('Edit group item:', item),
            onSettingsGroupItem: (item) => console.log('Settings group item:', item),
            onDeleteGroupItem: (itemId) => {
              const groupNode = getNodes().find(n => n.id === vueNode.id);
              if (groupNode?.data.blocks) {
                const updatedBlocks = groupNode.data.blocks.filter((b: any) => b.itemId !== itemId);
                handleUpdateNodeData(vueNode.id, { blocks: updatedBlocks });
              }
            },
            onUpdateGroupItem: (itemId, updatedItemData) => {
                const groupNode = getNodes().find(n => n.id === vueNode.id);
                if (groupNode?.data.blocks) {
                    const updatedBlocks = groupNode.data.blocks.map((b: any) =>
                        b.itemId === itemId ? { ...b, data: { ...b.data, ...updatedItemData } } : b
                    );
                    handleUpdateNodeData(vueNode.id, { blocks: updatedBlocks });
                }
            },
          }),
          // For BlockPackage, originalPackageData should be populated with full data from store if available
          // This might mean fetching it here if props.data.nodes doesn't already contain it.
          ...(reactNodeType === 'BlockPackage' && {
             originalPackageData: initialData, // Assuming initialData has all fields for a package from the store
             packageId: initialData.id || vueNode.id, // Ensure packageId is set to the package's own ID
          })
        },
        ...((vueNode as any).dimensions && { width: (vueNode as any).dimensions.width, height: (vueNode as any).dimensions.height }),
        selected: (vueNode as any).selected || false,
        dragging: (vueNode as any).dragging || false,
      };
    });
    const initialEdges = (props.data?.edges || []).map(edge => ({
      ...edge,
      type: edge.type || 'custom-edge',
    }));
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [props.data, setNodes, setEdges, handleUpdateNodeData, handleDeleteNode]);

  // Fit view on initial load or when nodes/edges significantly change
  React.useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      fitView({ duration: 200 });
    }
  }, [nodes, edges, fitView, props.data?.x, props.data?.y, props.data?.zoom]);


  const onNodesChange: (changes: NodeChange[]) => void = useCallback(
    (changes) => {
      onNodesChangeInternal(changes); // Use the internal handler from useNodesState
      // Call onUpdateNode for position changes (drag) or other structural changes handled by React Flow
      changes.forEach(change => {
        if (props.onUpdateNode) {
            if (change.type === 'position' && change.dragging === false) {
                const node = getNodes().find(n => n.id === change.id);
                if (node) props.onUpdateNode(node);
            }
            // Potentially handle other changes like 'dimensions' if your custom nodes can resize themselves
            // and you need to inform the parent about it.
        }
      });
    },
    [onNodesChangeInternal, props.onUpdateNode, getNodes]
  );

  const onEdgesChange: (changes: EdgeChange[]) => void = useCallback(
    (changes) => onEdgesChangeInternal(changes), // Use the internal handler from useEdgesState
    [onEdgesChangeInternal]
  );

  // onNodesDelete is called by React Flow when nodes are deleted via UI (e.g., backspace)
  const onNodesDeleteReactFlowCallback: OnNodesDelete = useCallback(
    (deletedNodes) => {
      // Call the main onDeleteNode prop for consistency
      if (props.onDeleteNode) {
        deletedNodes.forEach((node) => {
          // Ensure full node data object if needed by parent, though usually just ID
          props.onDeleteNode?.(node.id);
        });
      }
      // Internal state update is handled by onNodesChange if using useNodesState fully
      // but since we have handleDeleteNodeCallback for custom node deletes, ensure consistency if needed.
      // For now, rely on onNodesChange to update the nodes array via applyNodeChanges.
    },
    [props.onDeleteNode]
  );

  // onEdgesDelete can be used if specific side effects are needed beyond React Flow's internal handling
  const onEdgesDelete: OnEdgesDelete = useCallback(
    (deletedEdges) => {
      // console.log('Edges deleted by React Flow:', deletedEdges);
      // If props.onDeleteEdge is provided, call it here.
    },
    [] // Add props.onDeleteEdge if it exists
  );

  const onConnectCallback: OnConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        updatable: true,
        type: 'custom-edge',
        data: { label: '' }, // Add default data for new edges if needed
      };
      setEdges((eds) => addEdge(newEdge, eds));
      // If props.onConnect is provided, call it here.
    },
    [setEdges] // Add props.onConnect if it exists
  );

  const onEdgeUpdateCallback: OnEdgeUpdateFunc = useCallback(
    (oldEdge, newConnection) => {
      setEdges((els) => rfUpdateEdge(oldEdge, newConnection, els));
      // If props.onUpdateEdge is provided, call it here.
    },
    [setEdges, rfUpdateEdge] // Add props.onUpdateEdge if it exists
  );

  const onNodeClickCallback = useCallback(
    (event: React.MouseEvent, node: Node<NodeData>) => {
      // Default onEdit behavior (e.g., select node, or quick edit if any)
      props.onEdit?.({ id: node.type, blockId: node.id, data: node.data });

      // Check if the node has a specific onSettings handler in its data (passed during map)
      // This allows custom nodes to override or augment the default click behavior for settings.
      if (node.data?.onSettings) {
         // node.data.onSettings(); // This is already set to call handleOpenSettingsModal(node)
      } else {
        // Fallback or default behavior: open settings modal for this node type if not handled by onEdit
        // This could be based on node.type or other conditions.
        // For now, we rely on the onSettings in data if a node wants to open the modal.
        // Or, we can make onNodeClick *always* try to open settings if props.onEdit is not enough.
         handleOpenSettingsModal(node); // Example: click opens settings by default
      }
    },
    [props.onEdit, handleOpenSettingsModal]
  );

  const defaultEdgeOptions = {
    type: 'custom-edge',
    markerEnd: { type: MarkerType.ArrowClosed },
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodesDelete={onNodesDeleteReactFlowCallback} // Renamed to avoid conflict
      onEdgesDelete={onEdgesDeleteCallback}
      onConnect={onConnectCallback}
      onEdgeUpdate={onEdgeUpdateCallback}
      onNodeClick={onNodeClickCallback} // Updated to handle settings modal
      onLoad={props.onInit}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView={false} // fitView is now handled by useEffect
      minZoom={props.options?.minZoom || 0.1}
      maxZoom={props.options?.maxZoom || 2.5}
      deleteKeyCode={props.options?.deleteKeyCode || 'Delete'}
      multiSelectionKeyCode={props.options?.multiSelectionKeyCode || 'Shift'}
      nodesDraggable={!props.disabled}
      nodesConnectable={!props.disabled}
      elementsSelectable={!props.disabled}
      connectionMode="loose" // Or "strict"
    >
      <Background gap={props.options?.gridSize || 20} />
      {props.minimap && <MiniMap style={{border: '1px solid #ddd', borderRadius: '4px'}} nodeStrokeWidth={3} nodeColor={(n) => n.style?.background as string || '#fff'} />}
      {props.editorControls && (
        <Panel position={props.options?.controlsPosition || "bottom-left"} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          {props.controlsPrepend}
          <EditorSearchBlocks />
          <button title="Zoom In" onClick={() => zoomIn({ duration: 200 })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>➕</button>
          <button title="Zoom Out" onClick={() => zoomOut({ duration: 200 })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>➖</button>
          <button title="Fit View" onClick={() => fitView({ duration: 200 })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>🔎</button>
          {props.controlsAppend}
        </Panel>
      )}
       <Controls showInteractive={!props.disabled} style={{border: '1px solid #ddd', borderRadius: '4px', background: '#fff', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}} />

      {isSettingsModalOpen && currentBlockForSettings && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="modal-content bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" style={{minWidth: '500px'}}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Block: {currentBlockForSettings.data.label || currentBlockForSettings.id}</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">&times;</button>
            </div>
            <EditBlockSettings
              blockData={{
                id: currentBlockForSettings.type || '', // block type id
                blockId: currentBlockForSettings.id, // unique instance id
                data: currentBlockForSettings.data,
                itemId: currentBlockForSettings.data.itemId, // Pass itemId if it exists
              }}
              onSettingsChange={handleSaveSettings}
              // onErrorLabel can be passed if needed
            />
          </div>
        </div>
      )}
    </ReactFlow>
  );
};

const WorkflowEditor: React.FC<WorkflowEditorProps> = (props) => {
  // Determine initial viewport if provided, else React Flow will determine
  const initialViewport = props.data?.x && props.data?.y && props.data?.zoom !== undefined // check zoom defined
    ? { x: props.data.x, y: props.data.y, zoom: props.data.zoom }
    : undefined;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }} className={`workflow-editor-container ${props.disabled ? 'disabled' : ''}`}>
      <ReactFlowProvider initialNodes={props.data?.nodes} initialEdges={props.data?.edges} initialViewport={initialViewport}>
        <FlowCanvas {...props} /> {/* Pass all props down to FlowCanvas */}
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowEditor;
