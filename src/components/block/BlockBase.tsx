import React, { useState, useCallback, useContext } from 'react';
import { NodeProps } from 'reactflow'; // Assuming data might come from NodeProps if used directly as a node

// --- Placeholder for UI Card ---
const UiCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 ${className}`}>
    {children}
  </div>
);

// --- Placeholder for v-remixicon ---
const RemixIcon: React.FC<{ name: string; size?: string | number; className?: string; title?: string; onClick?: () => void; }> =
  ({ name, size = "20", className = "", title, onClick }) => (
    <span className={`inline-block ${className}`} title={title} onClick={onClick} style={{ fontSize: `${size}px` }}>
      {/* Basic placeholder based on name */}
      {name === 'riDeleteBin7Line' && '🗑️'}
      {name === 'riSettings3Line' && '⚙️'}
      {name === 'riDragDropLine' && '✥'}
      {name === 'riToggleLine' && '⚪'}
      {name === 'riToggleFill' && '🔵'}
      {name === 'riPlayLine' && '▶️'}
      {name === 'riPencilLine' && '✏️'}
      {name === 'riFileEditLine' && '📝'}
      {name === 'riRecordCircleFill' && '🔴'}
      {!['riDeleteBin7Line', 'riSettings3Line', 'riDragDropLine', 'riToggleLine', 'riToggleFill', 'riPlayLine', 'riPencilLine', 'riFileEditLine', 'riRecordCircleFill'].includes(name) && '❓'}
    </span>
  );

// --- Workflow Context (Simplified) ---
// In a real app, this would be defined elsewhere and provide actual utility functions.
interface WorkflowUtilsContextType {
  executeFromBlock?: (blockId: string) => void;
  // Add other utils if needed, e.g., for drag-and-drop group functionality
}
const WorkflowUtilsContext = React.createContext<WorkflowUtilsContextType | null>(null);

// Props for BlockBase component
export interface BlockBaseProps {
  blockId: string;
  blockData?: { // Definition/details of the block from a library/registry
    details?: {
      id?: string; // e.g. 'trigger', 'delay'
      disableDelete?: boolean;
      disableEdit?: boolean;
    };
    // other definition data
  };
  data: { // Instance data of the block
    disableBlock?: boolean;
    $breakpoint?: boolean;
    [key: string]: any; // Other instance-specific data
  };
  // Callbacks
  onDelete?: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onUpdate?: (updatedData: Partial<BlockBaseProps['data']>) => void;

  // Slots as props
  prependSlot?: React.ReactNode;
  appendSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  children: React.ReactNode; // Main content

  contentClass?: string;
  className?: string; // For the outer div
  selected?: boolean; // If the block is selected (passed by React Flow)
}

// Based on excludeGroupBlocks in Vue
const excludeGroupBlocks = ['blocks-group', 'block-package'];


const BlockBase: React.FC<BlockBaseProps> = ({
  blockId,
  blockData = {},
  data,
  onDelete,
  onEdit,
  onSettings,
  onUpdate,
  prependSlot,
  appendSlot,
  actionSlot,
  children,
  contentClass = '',
  className = '',
  selected, // Will be true if the node is selected
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const workflowUtils = useContext(WorkflowUtilsContext);

  const { details } = blockData;

  const handleInsertToClipboard = () => {
    navigator.clipboard.writeText(blockId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  const handleStartDrag = (event: React.DragEvent) => {
    // Simplified drag payload. Actual implementation may need more details specific to the app.
    const payload = {
      blockId,
      id: details?.id,
      data, // instance data
      fromBlockBasic: true, // This flag was in the Vue version
    };
    event.dataTransfer.setData('application/json', JSON.stringify(payload)); // Use a common format
    // event.dataTransfer.effectAllowed = 'move'; // Optional: set drag effect
  };

  const handleRunWorkflow = () => {
    if (workflowUtils?.executeFromBlock) {
      workflowUtils.executeFromBlock(blockId);
    } else {
      console.warn('executeFromBlock utility not available in context.');
    }
  };

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  return (
    <div
      className={`block-base relative w-56 ${className} ${selected ? 'ring-2 ring-blue-500' : ''}`} // w-48 from vue, adjusted for wider icons
      data-block-id={blockId}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit?.(); }}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
      style={{ borderWidth: selected ? '2px' : '1px', borderColor: selected ? '#3B82F6' : 'transparent' }} // Example selection style
    >
      {showMenu && (
        <div
          className="block-menu-container absolute top-0 left-0 right-0 z-20 p-1 bg-gray-100 dark:bg-gray-700 rounded-t-md"
          style={{ transform: 'translateY(-100%)' }}
        >
          <div className="flex justify-between items-center text-xs">
            <p
              title="Block ID (click to copy)"
              className="block-menu-item text-overflow px-1 dark:text-gray-300 cursor-pointer"
              style={{ maxWidth: '96px' }}
              onClick={handleInsertToClipboard}
            >
              {isCopied ? '✅ Copied' : blockId}
            </p>
            <div className="block-menu-actions inline-flex items-center dark:text-gray-300 space-x-1">
              {!details?.disableDelete && onDelete && (
                <button title="Delete block" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <RemixIcon name="riDeleteBin7Line" size="18" />
                </button>
              )}
              {onSettings && (
                 <button title={t('workflow.blocks.base.settings.title', 'Settings')} onClick={(e) => { e.stopPropagation(); onSettings(); }}>
                  <RemixIcon name="riSettings3Line" size="18" />
                </button>
              )}
              {!excludeGroupBlocks.includes(details?.id || '') && (
                <button
                  title={t('workflow.blocks.base.moveToGroup', 'Move to group')}
                  draggable="true"
                  onDragStart={handleStartDrag}
                  onMouseDown={(e) => e.stopPropagation()} // Prevent node drag
                  className="cursor-move"
                >
                  <RemixIcon name="riDragDropLine" size="18" />
                </button>
              )}
              {details?.id !== 'trigger' && onUpdate && (
                <button title="Enable/Disable block" onClick={(e) => { e.stopPropagation(); onUpdate({ disableBlock: !data.disableBlock }); }}>
                  <RemixIcon name={data.disableBlock ? 'riToggleLine' : 'riToggleFill'} size="18" />
                </button>
              )}
              <button title="Run workflow from here" onClick={(e) => { e.stopPropagation(); handleRunWorkflow(); }}>
                <RemixIcon name="riPlayLine" size="18" />
              </button>
              {!details?.disableEdit && onEdit && (
                <button title="Edit block" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <RemixIcon name="riPencilLine" size="18" />
                </button>
              )}
              {actionSlot}
            </div>
          </div>
        </div>
      )}

      {prependSlot}
      <UiCard className={`block-base__content relative z-10 ${contentClass}`}>
        {/* Breakpoint indicator - assuming workflow.data.value.testingMode is passed via context or props if needed */}
        {/* For now, let's assume it's not part of this base component directly, or passed in `data` */}
        {data.$breakpoint !== undefined && onUpdate && ( // Check if $breakpoint is a relevant prop
             <RemixIcon
                className={`absolute left-1 top-1 cursor-pointer ${data.$breakpoint ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'}`}
                name="riRecordCircleFill"
                title="Set as breakpoint"
                size="18"
                onClick={(e) => { e.stopPropagation(); onUpdate({ $breakpoint: !data.$breakpoint }); }}
             />
        )}
        {children}
      </UiCard>
      {appendSlot}
    </div>
  );
};

export default BlockBase;

// Example of how to provide context (would be in WorkflowEditor.tsx or higher)
// <WorkflowUtilsContext.Provider value={{ executeFromBlock: (id) => console.log('Execute from', id) }}>
//   <ReactFlow nodes={nodes} ... />
// </WorkflowUtilsContext.Provider>
