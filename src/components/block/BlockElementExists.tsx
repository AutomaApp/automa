import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BlockBase, { BlockBaseProps, RemixIcon } from './BlockBase';

// Define structure for block definition data BlockElementExists expects
interface BlockElementExistsDefinition {
  id: string; // e.g., 'element-exists'
  name: string; // Default name "Element Exists"
  icon?: string;
  category?: { color?: string };
}

// Define data structure for BlockElementExists node
export interface BlockElementExistsData {
  description?: string;
  selector?: string;
  disableBlock?: boolean;
  $breakpoint?: boolean;

  blockDefinition?: BlockElementExistsDefinition;

  // Callbacks
  onUpdateData?: (updatedData: Partial<BlockElementExistsData>) => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
}

const BlockElementExists: React.FC<NodeProps<BlockElementExistsData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    description,
    selector,
    disableBlock,
    $breakpoint,
    blockDefinition,
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
  } = data;

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const definition = useMemo<BlockElementExistsDefinition>(() => blockDefinition || {
    id: type,
    name: 'Element Exists',
    category: { color: 'bg-teal-200' }, // Example color
    icon: 'riFocus3Line',
  }, [blockDefinition, type]);

  const blockName = t('workflow.blocks.element-exists.name', definition.name);
  const iconColor = disableBlock ? 'bg-gray-300 dark:bg-gray-600' : definition.category?.color || 'bg-teal-500';

  const displaySelector = description || selector || t('workflow.blocks.element-exists.selector', 'CSS Selector');

  const blockBaseProps: BlockBaseProps = {
    blockId: instanceId,
    data: { disableBlock, $breakpoint, ...data },
    blockData: { details: { id: definition.id, name: blockName, icon: definition.icon } },
    onDelete,
    onEdit: onEdit || onSettings,
    onSettings,
    onUpdate: onUpdateData,
    selected,
    contentClass: 'p-2', // Custom padding
  };

  // Approximate handle positions from Vue version; top output is default, second is lower.
  // In React Flow, `Handle` positions are relative to the node bounds.
  // The `style` prop on `Handle` can be used for fine-tuning.
  // The Vue `style="top: auto; bottom: 12px"` for the second handle is relative to its parent.
  // We'll position the first handle normally (React Flow centers it vertically by default on L/R).
  // The second handle will be explicitly positioned lower.

  return (
    <BlockBase {...blockBaseProps} className="block-element-exists w-52"> {/* Width from Vue: 195px, adjusted */}
      <Handle type="target" position={Position.Left} id={`${instanceId}-input-1`} style={{ background: '#555' }} />

      <div className={`mb-1 inline-flex items-center rounded-lg p-1.5 text-xs dark:text-black ${iconColor}`}>
        <RemixIcon name={definition.icon || 'riFocus3Line'} size="18" className="mr-1" />
        <span>{blockName}</span>
      </div>

      <p
        title={t('workflow.blocks.element-exists.selector', 'CSS Selector')}
        className={`text-overflow bg-gray-50 dark:bg-gray-700/50 mb-1 rounded-md p-1.5 text-xs text-right truncate ${!description ? 'font-mono' : ''}`}
      >
        {displaySelector}
      </p>

      {/* Text for the second output handle (Fallback) */}
      <div className="text-right text-xs text-gray-500 dark:text-gray-400 pr-1">
        <span title={t('workflow.blocks.element-exists.fallbackTitle', 'Element does not exist') || 'Element does not exist'}>
          ℹ
        </span>
        {' '}{t('common.fallback', 'Fallback')}
      </div>

      {/* Output handle 1 (True / Element exists) */}
      {/* React Flow positions this mid-right by default. If more specific position needed, use style.top */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${instanceId}-output-1`}
        style={{ background: '#555', top: '35%' }} // Adjusted for two outputs
      />

      {/* Output handle 2 (False / Fallback) */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${instanceId}-output-2`}
        style={{ background: '#555', top: '65%' }} // Positioned lower
      />
    </BlockBase>
  );
};

export default BlockElementExists;
