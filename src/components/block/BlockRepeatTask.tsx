import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BlockBase, { BlockBaseProps, RemixIcon } from './BlockBase';

// Define structure for block definition data BlockRepeatTask expects
interface BlockRepeatTaskDefinition {
  id: string; // e.g., 'repeat-task'
  name: string;
  icon?: string;
  category?: { color?: string };
}

// Define data structure for BlockRepeatTask node
export interface BlockRepeatTaskData {
  repeatFor?: string | number; // Number of times to repeat
  disableBlock?: boolean;
  $breakpoint?: boolean;
  blockDefinition?: BlockRepeatTaskDefinition;
  // Callbacks
  onUpdateData?: (updatedData: Partial<BlockRepeatTaskData>) => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
}

const BlockRepeatTask: React.FC<NodeProps<BlockRepeatTaskData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    repeatFor = '',
    disableBlock,
    $breakpoint,
    blockDefinition,
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
  } = data;

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const definition = useMemo<BlockRepeatTaskDefinition>(() => blockDefinition || {
    id: type,
    name: 'Repeat Task',
    category: { color: 'bg-indigo-200' }, // Example color
    icon: 'riRepeat2Line',
  }, [blockDefinition, type]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateData?.({ repeatFor: event.target.value });
  };

  const blockName = t('workflow.blocks.repeat-task.name', definition.name);
  const iconColor = disableBlock ? 'bg-gray-300 dark:bg-gray-600' : definition.category?.color || 'bg-indigo-500';

  const blockBaseProps: BlockBaseProps = {
    blockId: instanceId,
    data: { disableBlock, $breakpoint, ...data },
    blockData: { details: { id: definition.id, name: blockName, icon: definition.icon } },
    onDelete,
    onEdit: onEdit || onSettings,
    onSettings,
    onUpdate: onUpdateData,
    selected,
    contentClass: 'p-2',
  };

  // Handle positioning based on original CSS:
  // Output 1 ("Repeat Body"): top: 74px (relative to .drawflow .repeat-task)
  // Output 2 ("Completed"): top: auto; bottom: 12px
  // In React Flow, this is relative to the node itself.
  // Assuming an approximate height for the content before the handles.
  const output1Top = '35%'; // Adjusted for two outputs
  const output2Top = '65%'; // Positioned lower

  return (
    <BlockBase {...blockBaseProps} className="block-repeat-task w-60"> {/* w-64 in Vue */}
      <Handle type="target" position={Position.Left} id={`${instanceId}-input-1`} style={{ background: '#555' }} />

      <div className="flex items-center mb-2">
        <div className={`mr-2 inline-flex items-center rounded-lg p-1.5 text-xs dark:text-black ${iconColor}`}>
          <RemixIcon name={definition.icon || 'riRepeat2Line'} size="18" className="mr-1" />
          <span>{blockName}</span>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 relative flex items-center rounded-md">
        <input
          value={repeatFor}
          placeholder="0"
          type="text" // Vue version was text, allows expressions potentially. Use number if only numbers.
          className="bg-transparent py-1.5 px-3 text-sm focus:ring-0 focus:outline-none"
          style={{ paddingRight: '50px', width: '100%' }} // Ensure space for "times" text
          onChange={handleInputChange}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <span className="absolute right-3 text-xs text-gray-500 dark:text-gray-400">
          {t('workflow.blocks.repeat-task.times', 'times')}
        </span>
      </div>

      <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1 pr-1">
        {/* This label seems to be for the first output handle in Vue */}
        {t('workflow.blocks.repeat-task.repeatFrom', 'Repeat Body')}
      </p>

      {/* Output 1: Task to repeat */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${instanceId}-output-1`}
        style={{ background: '#555', top: output1Top }}
      />

      {/* Output 2: After repetition is done / Completed */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${instanceId}-output-2`}
        style={{ background: '#555', top: output2Top }}
      />
    </BlockBase>
  );
};

export default BlockRepeatTask;
