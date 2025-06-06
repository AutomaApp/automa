import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NodeProps, Handle, Position } from 'reactflow'; // Added Handle and Position if it needs to connect

// Data for the group node itself
export interface BlockGroup2Data {
  name?: string;
  width?: number;
  height?: number;
  // blockDefinition?: any; // Not strictly needed if appearance is fixed or from style
  onUpdateData?: (updatedData: Partial<BlockGroup2Data>) => void; // For name changes
  onDelete?: () => void; // If it has a delete button
  // Note: Resizing is handled via onResize/onResizeStop from ReactFlow if using built-in resizer,
  // or custom logic here.
}

const BlockGroup2: React.FC<NodeProps<BlockGroup2Data>> = ({ id, data, selected, dragging }) => {
  const {
    name = 'Group',
    width: initialWidth = 400,
    height: initialHeight = 300,
    onUpdateData,
    onDelete,
  } = data;

  const [currentName, setCurrentName] = useState(name);
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const dragHandleRef = useRef<HTMLSpanElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Sync name from props
  useEffect(() => {
    setCurrentName(name);
  }, [name]);

  // Sync size from props (e.g. if changed externally or by React Flow's resizer)
  useEffect(() => {
    setSize({ width: initialWidth, height: initialHeight });
  }, [initialWidth, initialHeight]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentName(event.target.value);
  };

  const handleNameBlur = () => {
    if (name !== currentName) {
      onUpdateData?.({ name: currentName });
    }
  };

  // Custom Resizing Logic (simplified from Vue, React Flow might offer better ways)
  const initDragging = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!nodeRef.current) return;
    const parentNode = nodeRef.current; // The main group div

    const startRect = {
      x: e.clientX,
      y: e.clientY,
      width: parseInt(parentNode.style.width, 10) || size.width,
      height: parseInt(parentNode.style.height, 10) || size.height,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();

      const newWidth = startRect.width + (moveEvent.clientX - startRect.x);
      const newHeight = startRect.height + (moveEvent.clientY - startRect.y);

      parentNode.style.width = `${Math.max(100, newWidth)}px`; // Min width 100px
      parentNode.style.height = `${Math.max(100, newHeight)}px`; // Min height 100px
    };

    const onMouseUp = () => {
      document.documentElement.removeEventListener('mousemove', onMouseMove);
      document.documentElement.removeEventListener('mouseup', onMouseUp);

      if (!nodeRef.current) return;
      const finalWidth = parseInt(nodeRef.current.style.width, 10);
      const finalHeight = parseInt(nodeRef.current.style.height, 10);

      setSize({ width: finalWidth, height: finalHeight });
      onUpdateData?.({ width: finalWidth, height: finalHeight });
      // Important: Inform React Flow about the resize if not using its built-in resizer
      // This might involve calling a prop passed down from WorkflowEditor or directly updating the node via setNodes
    };

    document.documentElement.addEventListener('mousemove', onMouseMove);
    document.documentElement.addEventListener('mouseup', onMouseUp);

  }, [size.width, size.height, onUpdateData]);

  useEffect(() => {
    const handle = dragHandleRef.current;
    if (handle) {
      // Cast to EventListener to satisfy addEventListener/removeEventListener
      const listener = initDragging as unknown as EventListener;
      handle.addEventListener('mousedown', listener);
      return () => {
        handle.removeEventListener('mousedown', listener);
      };
    }
  }, [initDragging]);


  // This node is primarily a container. React Flow handles rendering child nodes
  // if their `parentNode` property is set to this node's `id`.
  // It can optionally have handles if the group itself can be connected.
  return (
    <div
      ref={nodeRef}
      className={`block-group2 group relative rounded-lg border-2 p-1 ${selected ? 'border-blue-600 shadow-lg' : 'border-blue-500'} ${dragging ? 'opacity-70' : ''}`}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: '150px', // min from vue
        minHeight: '100px', // min from vue
        backgroundColor: 'rgba(37, 99, 235, 0.15)', // Adjusted opacity
        // Ensure pointerEvents allows interaction with children if any are directly inside this div
      }}
    >
      {/* Optional: Handles if the group itself can be connected */}
      {/* <Handle type="target" position={Position.Top} style={{background: '#555'}} /> */}
      {/* <Handle type="source" position={Position.Bottom} style={{background: '#555'}} /> */}

      <div className="flex items-center bg-white/30 dark:bg-black/30 p-1.5 rounded-t-md">
        <input
          type="text"
          value={currentName}
          placeholder="Group name"
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex-grow rounded-md bg-white/70 dark:bg-gray-700/70 px-2 py-1 text-sm font-semibold focus:ring-1 focus:ring-blue-500"
        />
        {onDelete && (
           <button onClick={onDelete} className="ml-2 p-1 hover:bg-red-500/20 rounded" title="Delete group">
             <RemixIcon name="riDeleteBin7Line" size="18" />
           </button>
        )}
      </div>

      {/* Content area for React Flow to render child nodes */}
      {/* This div is just a placeholder for where children would appear visually within the bounds */}
      <div className="children-container h-full w-full">
        {/* Child nodes are rendered by React Flow engine based on parentNode prop, not here directly */}
      </div>

      <span
        ref={dragHandleRef}
        title="Resize group"
        className="drag-handle invisible absolute bottom-0 right-0 h-4 w-4 bg-blue-600 hover:bg-blue-700 cursor-nwse-resize group-hover:visible"
        // Using nwse-resize as it's common for bottom-right corner
      />
    </div>
  );
};

export default BlockGroup2;
