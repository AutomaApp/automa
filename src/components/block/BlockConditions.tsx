import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BlockBase, { BlockBaseProps, RemixIcon } from './BlockBase';

// Define structure for a single condition item
interface ConditionItem {
  id: string; // Unique ID for the condition, used for handle
  name?: string; // Optional name for the condition
  compareValue?: string;
  type?: string; // e.g., '===', '>', '<'
  value?: string;
}

// Define structure for block definition data BlockConditions expects
interface BlockConditionsDefinition {
  id: string; // e.g., 'conditions'
  name: string; // Default name "Conditions"
  icon?: string;
  category?: { color?: string };
}

// Define data structure for BlockConditions node
export interface BlockConditionsData {
  description?: string;
  conditions?: ConditionItem[];
  disableBlock?: boolean;
  $breakpoint?: boolean;

  blockDefinition?: BlockConditionsDefinition;

  // Callbacks
  onUpdateData?: (updatedData: Partial<BlockConditionsData>) => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: (editParams: { editCondition?: string } | undefined) => void; // Allow editing specific condition
}

const BlockConditions: React.FC<NodeProps<BlockConditionsData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    description,
    conditions = [],
    disableBlock,
    $breakpoint,
    blockDefinition,
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
  } = data;

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const definition = useMemo<BlockConditionsDefinition>(() => blockDefinition || {
    id: type,
    name: 'Conditions',
    category: { color: 'bg-purple-200' },
    icon: 'riAB', // Or another suitable icon
  }, [blockDefinition, type]);

  const blockName = t('workflow.blocks.conditions.name', definition.name);
  const iconColor = disableBlock ? 'bg-gray-300 dark:bg-gray-600' : definition.category?.color || 'bg-purple-500';

  const blockBaseProps: BlockBaseProps = {
    blockId: instanceId,
    data: { disableBlock, $breakpoint, ...data },
    blockData: { details: { id: definition.id, name: blockName, icon: definition.icon } },
    onDelete,
    onEdit: () => onEdit?.(undefined), // General edit
    onSettings,
    onUpdate: onUpdateData,
    selected,
    contentClass: 'p-2',
  };

  // Calculate the position for each handle dynamically
  const getHandlePosition = (index: number, total: number) => {
    // This is a simple distribution. More sophisticated logic might be needed
    // depending on the desired visual appearance and number of handles.
    // The original Vue component had fixed styles, implying a fixed layout for conditions.
    // Let's assume a max of ~4-5 conditions for this simple distribution.
    // Base top position + spacing for each condition.
    // Vue handles were `top: 82px` and `margin-bottom: 32px` relative to something.
    // Here, we position relative to the list item.
    return 50; // Percentage from top of the list item, effectively center.
  };


  return (
    <BlockBase {...blockBaseProps} className="block-conditions w-64">
      <Handle type="target" position={Position.Left} id={`${instanceId}-input-1`} style={{ background: '#555' }} />

      <div className="flex items-center">
        <div className={`mr-2 inline-flex items-center rounded-lg p-1.5 text-xs dark:text-black ${iconColor}`}>
          <RemixIcon name={definition.icon || 'riAB'} size="18" className="mr-1" />
          <span>{blockName}</span>
        </div>
      </div>

      {description && (
        <p className="text-xs mt-1 leading-tight text-gray-500 dark:text-gray-300 truncate">
          {description}
        </p>
      )}

      {conditions && conditions.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {conditions.map((item, index) => (
            <li
              key={item.id}
              className="bg-gray-50 dark:bg-gray-700/50 relative flex w-full flex-1 items-center rounded-md p-1.5 text-xs"
              onDoubleClick={(e) => { e.stopPropagation(); onEdit?.({ editCondition: item.id }); }}
              title={item.name || `${item.compareValue} ${item.type} ${item.value}`}
            >
              {item.name ? (
                <p className="text-overflow w-full text-left truncate pr-2">
                  {item.name}
                </p>
              ) : (
                <>
                  <p className="text-overflow w-5/12 text-right truncate">
                    {item.compareValue || '_____'}
                  </p>
                  <p className="mx-1 w-2/12 text-center font-mono font-semibold">
                    {item.type}
                  </p>
                  <p className="text-overflow w-5/12 truncate">
                    {item.value || '_____'}
                  </p>
                </>
              )}
              <Handle
                type="source"
                position={Position.Right}
                id={`${instanceId}-output-${item.id}`}
                style={{ background: '#555', top: `${getHandlePosition(index, conditions.length)}%` }}
              />
            </li>
          ))}
          <li className="text-right text-xs text-gray-500 dark:text-gray-400 pr-2 pt-1">
            <span title="Fallback">ℹ</span> Fallback
          </li>
        </ul>
      )}

      {conditions.length > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id={`${instanceId}-output-fallback`}
          style={{ background: '#555', top: 'auto', bottom: 10 }}
        />
      )}
    </BlockBase>
  );
};

export default BlockConditions;
