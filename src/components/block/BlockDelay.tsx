import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BlockBase, { BlockBaseProps, RemixIcon } from './BlockBase'; // Assuming BlockBase.tsx is in the same directory

// Define structure for block definition data BlockDelay expects
interface BlockDelayDefinition {
  id: string; // e.g., 'delay'
  name: string; // Default name "Delay"
  icon?: string; // Icon name (e.g., 'riTimerLine')
  category?: { color?: string };
}

// Define data structure for BlockDelay node
export interface BlockDelayData {
  time?: string | number; // Delay time
  disableBlock?: boolean;
  $breakpoint?: boolean;

  blockDefinition?: BlockDelayDefinition;

  // Callbacks
  onUpdateData?: (updatedData: Partial<BlockDelayData>) => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
}

const BlockDelay: React.FC<NodeProps<BlockDelayData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    time = '',
    disableBlock,
    $breakpoint,
    blockDefinition,
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
  } = data;

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const definition = useMemo<BlockDelayDefinition>(() => blockDefinition || {
    id: type,
    name: 'Delay',
    category: { color: 'bg-yellow-200' }, // Default color for delay
    icon: 'riTimerLine',
  }, [blockDefinition, type]);

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateData?.({ time: event.target.value });
  };

  const blockName = t('workflow.blocks.delay.name', definition.name);
  const iconColor = disableBlock ? 'bg-gray-300 dark:bg-gray-600' : definition.category?.color || 'bg-yellow-500';

  // Prepare props for BlockBase
  const blockBaseProps: BlockBaseProps = {
    blockId: instanceId,
    data: { disableBlock, $breakpoint, ...data },
    blockData: { details: {id: definition.id, name: blockName, icon: definition.icon } },
    onDelete,
    onEdit: onEdit || onSettings,
    onSettings,
    onUpdate: onUpdateData,
    selected,
    contentClass: 'p-2', // Custom padding for delay block
  };

  return (
    <BlockBase {...blockBaseProps} className="block-delay w-48">
      <Handle type="target" position={Position.Left} id={`${instanceId}-input-1`} style={{ background: '#555' }} />

      <div className="flex items-center mb-2">
        <div className={`mr-2 inline-flex items-center rounded-lg p-1 text-xs dark:text-black ${iconColor}`}>
          <RemixIcon name={definition.icon || 'riTimerLine'} size="18" className="mr-1" />
          <span>{blockName}</span>
        </div>
        {/* The delete icon here is redundant if BlockBase provides one in its menu */}
        {/* <div className="flex-grow"></div>
        <RemixIcon name="riDeleteBin7Line" className="cursor-pointer" onClick={onDelete} /> */}
      </div>

      <input
        type="text" // Changed to text to allow "1s", "100ms" type values, though original was text too
        value={time}
        min="0" // For type="number", but good to keep if input type changes
        title={t('workflow.blocks.delay.input.title', 'Delay time (e.g., 1000ms or 1s)')}
        placeholder={t('workflow.blocks.delay.input.placeholder', 'e.g., 1s')}
        className="bg-gray-50 dark:bg-gray-700 w-full rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-offset-gray-800"
        onChange={handleTimeChange}
        onKeyDown={(e) => e.stopPropagation()} // Prevent React Flow keydown handlers
      />

      {/* The separate "Move to group" handle from Vue version is omitted, assuming BlockBase menu's drag handle is used */}

      <Handle type="source" position={Position.Right} id={`${instanceId}-output-1`} style={{ background: '#555' }} />
    </BlockBase>
  );
};

export default BlockDelay;
