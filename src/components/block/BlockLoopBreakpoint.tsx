import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BlockBase, { BlockBaseProps, RemixIcon } from './BlockBase'; // Assuming BlockBase.tsx

// --- Placeholder for UiCheckbox ---
interface UiCheckboxProps {
  modelValue: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
  className?: string;
}
const UiCheckbox: React.FC<UiCheckboxProps> = ({ modelValue, onChange, children, className }) => (
  <label className={`flex items-center space-x-2 cursor-pointer ${className}`}>
    <input
      type="checkbox"
      checked={modelValue}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded text-blue-500 focus:ring-blue-500"
    />
    <span>{children}</span>
  </label>
);
// --- End Placeholder ---


// Define structure for block definition data BlockLoopBreakpoint expects
interface BlockLoopBreakpointDefinition {
  id: string; // e.g., 'loop-breakpoint'
  name: string;
  icon?: string;
  category?: { color?: string };
}

// Define data structure for BlockLoopBreakpoint node
export interface BlockLoopBreakpointData {
  loopId?: string;
  clearLoop?: boolean;
  disableBlock?: boolean;
  $breakpoint?: boolean;
  blockDefinition?: BlockLoopBreakpointDefinition;
  // Callbacks
  onUpdateData?: (updatedData: Partial<BlockLoopBreakpointData>) => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
}

const BlockLoopBreakpoint: React.FC<NodeProps<BlockLoopBreakpointData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    loopId = '',
    clearLoop = false,
    disableBlock,
    $breakpoint,
    blockDefinition,
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
  } = data;

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const definition = useMemo<BlockLoopBreakpointDefinition>(() => blockDefinition || {
    id: type,
    name: 'Loop Breakpoint',
    category: { color: 'bg-red-200' }, // Example color
    icon: 'riStopLine',
  }, [blockDefinition, type]);

  const handleLoopIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLoopId = event.target.value.replace(/\s/g, ''); // Sanitize spaces
    onUpdateData?.({ loopId: newLoopId });
  };

  const handleClearLoopChange = (newClearLoop: boolean) => {
    onUpdateData?.({ clearLoop: newClearLoop });
  };

  const blockName = t('workflow.blocks.loop-breakpoint.name', definition.name);
  const iconColor = disableBlock ? 'bg-gray-300 dark:bg-gray-600' : definition.category?.color || 'bg-red-500';

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

  return (
    <BlockBase {...blockBaseProps} className="block-loop-breakpoint w-52"> {/* w-48 in Vue */}
      <Handle type="target" position={Position.Left} id={`${instanceId}-input-1`} style={{ background: '#555' }} />

      <div className="flex items-center mb-2">
        <div className={`mr-2 inline-flex items-center rounded-lg p-1.5 text-xs dark:text-black ${iconColor}`}>
          <RemixIcon name={definition.icon || 'riStopLine'} size="18" className="mr-1" />
          <span>{blockName}</span>
        </div>
        {/* Redundant delete icon if BlockBase menu has it */}
        {/* <div className="flex-grow"></div>
        <RemixIcon name="riDeleteBin7Line" className="cursor-pointer" onClick={onDelete} /> */}
      </div>

      <input
        type="text"
        value={loopId}
        placeholder="Loop ID"
        className="bg-gray-50 dark:bg-gray-700 w-full rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-offset-gray-800"
        required
        onChange={handleLoopIdChange}
        onKeyDown={(e) => e.stopPropagation()}
      />

      <UiCheckbox
        modelValue={clearLoop}
        onChange={handleClearLoopChange}
        className="mt-2 text-sm text-gray-700 dark:text-gray-200"
      >
        {t('workflow.blocks.loop-breakpoint.clearLoop', 'Stop loop')}
      </UiCheckbox>

      <Handle type="source" position={Position.Right} id={`${instanceId}-output-1`} style={{ background: '#555' }} />
    </BlockBase>
  );
};

export default BlockLoopBreakpoint;
