import React, { useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BlockBase, { BlockBaseProps } from './BlockBase'; // Assuming BlockBase.tsx is in the same directory
import { RemixIcon } from './BlockBase'; // Re-using placeholder RemixIcon from BlockBase for now

// Define structure for block definition data that BlockBasic expects
// This would typically come from a block registry or be passed in props.data
interface BlockDefinition {
  id: string; // e.g., 'trigger', 'get-variable'
  name: string; // Default name
  icon?: string; // Icon name (e.g., 'riGlobalLine')
  category?: { color?: string }; // Category color
  customIconPath?: string; // If icon is a custom SVG path string
  // Add other definition properties as needed
}

// Define data structure for BlockBasic node
// This merges with what React Flow provides in NodeProps<BlockBasicData>
export interface BlockBasicData {
  label?: string; // This might be the block type ID from React Flow's node.type
  description?: string;
  disableBlock?: boolean;
  $breakpoint?: boolean;
  onError?: { enable?: boolean; toDo?: string };
  loopId?: string; // For loop blocks
  refKey?: string; // For Google Sheets block

  // The block's static definition (icon, category color, etc.)
  // In Vue, this came from useEditorBlock(props.label)
  blockDefinition?: BlockDefinition;

  // Callbacks passed from WorkflowEditor
  onUpdateData?: (updatedData: Partial<BlockBasicData>) => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void; // If BlockBase dblclick edit is used

  // Validation errors (simplified for now)
  errors?: string; // HTML string or simple message
}

// Helper to get a placeholder icon if not found in RemixIcon
const getIconComponent = (iconName?: string, customPath?: string) => {
  if (customPath) {
    // In a real scenario, you might render an <img src={customPath} /> or an inline SVG
    return <span title={`Custom path: ${customPath}`}>🎨</span>;
  }
  return <RemixIcon name={iconName || 'riQuestionMark'} />;
};

const BlockBasic: React.FC<NodeProps<BlockBasicData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    label, // This is often the node's `type` in React Flow, e.g., "BlockBasic" or "trigger"
    description,
    disableBlock,
    $breakpoint,
    onError,
    loopId,
    refKey,
    blockDefinition, // Assuming this is populated by WorkflowEditor
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
    errors: blockErrors, // Validation errors
  } = data;

  const [isCopied, setIsCopied] = useState(false);
  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  // Try to get a sensible block definition, falling back if not provided
  const definition = useMemo<BlockDefinition>(() => blockDefinition || {
    id: type, // Use React Flow's node type as a fallback for id
    name: label || type, // Use label or type as fallback name
    category: { color: 'bg-gray-200' }, // Default color
    icon: 'riGlobalLine',
  }, [blockDefinition, label, type]);

  const showTextToCopy = useMemo(() => {
    if ((definition.id === 'loop-data' || definition.id === 'loop-elements') && loopId) {
      return { name: 'Loop ID', value: loopId };
    }
    if (definition.id === 'google-sheets' && refKey) {
      return { name: 'Reference Key', value: refKey };
    }
    return null;
  }, [definition.id, loopId, refKey]);

  const handleInsertToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  const blockName = definition.name || t(`workflow.blocks.${definition.id}.name`, definition.id);
  const iconColor = disableBlock ? 'bg-gray-300 dark:bg-gray-600' : definition.category?.color || 'bg-blue-500';

  // Prepare props for BlockBase
  const blockBaseProps: BlockBaseProps = {
    blockId: instanceId,
    data: { disableBlock, $breakpoint, ...data }, // Pass all instance data
    blockData: { details: definition }, // Pass definition as details
    onDelete,
    onEdit: onEdit || onSettings, // Default edit to open settings if no specific onEdit
    onSettings,
    onUpdate: onUpdateData,
    selected,
    contentClass: 'p-3', // Example padding
  };

  return (
    <BlockBase {...blockBaseProps} className="block-basic group">
      {type !== 'trigger' && ( // Assuming 'trigger' type nodes don't have a target handle
        <Handle
          type="target"
          position={Position.Left}
          id={`${instanceId}-input-1`}
          style={{ background: '#555' }}
        />
      )}
      <div className="flex items-center">
        <span className={`mr-2 inline-block rounded-lg p-2 dark:text-black ${iconColor}`}>
          {getIconComponent(definition.icon, definition.customIconPath)}
        </span>
        <div className="flex-1 overflow-hidden">
          {blockErrors && (
            <span
              title={blockErrors} // Basic tooltip, HTML content needs more setup
              className="absolute top-1 right-1 text-red-500 dark:text-red-400"
            >
              <RemixIcon name="riAlertLine" size="18" />
            </span>
          )}
          <p className="text-sm font-semibold leading-tight truncate pr-5">
            {blockName}
          </p>
          {description && (
            <p className="text-xs leading-tight text-gray-500 dark:text-gray-300 truncate">
              {description}
            </p>
          )}
          {showTextToCopy && (
            <span
              title={`${showTextToCopy.name} (click to copy)`}
              className="bg-gray-100 dark:bg-gray-700 text-overflow absolute bottom-0 right-0 rounded-sm py-px px-1 text-xs text-gray-600 dark:text-gray-200 cursor-pointer"
              style={{ maxWidth: '40%' }}
              onClick={(e) => { e.stopPropagation(); handleInsertToClipboard(showTextToCopy.value); }}
            >
              {isCopied ? '✅ Copied' : showTextToCopy.value}
            </span>
          )}
        </div>
      </div>
      {/* Slot content from Vue version would go here if needed */}
      {onError?.enable && onError?.toDo === 'fallback' && (
        <div className="fallback flex items-center justify-end text-xs mt-1 text-gray-500">
          <RemixIcon name="riInformationLine" size="16" />
          <span className="ml-1">{t('common.fallback', 'Fallback')}</span>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id={`${instanceId}-output-1`}
        style={{ background: '#555' }}
      />
      {onError?.enable && onError?.toDo === 'fallback' && (
        <Handle
          type="source"
          position={Position.Right}
          id={`${instanceId}-output-fallback`}
          style={{ background: '#555', bottom: 10, top: 'auto' }}
        />
      )}
    </BlockBase>
  );
};

export default BlockBasic;
