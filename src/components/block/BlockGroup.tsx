import React, { useMemo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BlockBase, { BlockBaseProps, RemixIcon } from './BlockBase';
// react-draggable or similar would be needed for full drag and drop functionality of internal blocks.
// For now, we'll render a static list or very basic reordering.

interface GroupedBlockItem {
  itemId: string; // Unique ID for this item within the group
  id: string; // Block definition ID (e.g., 'trigger', 'delay')
  data: any; // Data for this specific block instance
  // For display within the group:
  name?: string;
  icon?: string;
  description?: string;
}

interface BlockGroupDefinition {
  id: string; // e.g., 'blocks-group'
  name: string;
  icon?: string;
  category?: { color?: string };
}

export interface BlockGroupData {
  name?: string; // Name of the group itself
  blocks?: GroupedBlockItem[];
  disableBlock?: boolean;
  $breakpoint?: boolean;
  blockDefinition?: BlockGroupDefinition;
  // Callbacks
  onUpdateData?: (updatedData: Partial<BlockGroupData>) => void;
  onDelete?: () => void;
  onSettings?: () => void; // Settings for the group block itself
  onEdit?: () => void; // Edit for the group block itself
  // Callbacks for actions on items within the group (to be handled by WorkflowEditor or a modal)
  onEditGroupItem?: (item: GroupedBlockItem) => void;
  onSettingsGroupItem?: (item: GroupedBlockItem) => void;
  onDeleteGroupItem?: (itemId: string) => void;
  onUpdateGroupItem?: (itemId: string, updatedData: any) => void;
}

// Placeholder for tasks/block definitions registry
const tasksRegistry: Record<string, { name: string; icon: string }> = {
  'delay': { name: 'Delay', icon: 'riTimerLine' },
  'get-variable': { name: 'Get Variable', icon: 'riCodeBoxLine' },
  // Add other known block types that can be in a group
};


const BlockGroup: React.FC<NodeProps<BlockGroupData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    name: groupName = '',
    blocks = [],
    disableBlock,
    $breakpoint,
    blockDefinition,
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
    onEditGroupItem,
    onSettingsGroupItem,
    onDeleteGroupItem,
    onUpdateGroupItem,
  } = data;

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const definition = useMemo<BlockGroupDefinition>(() => blockDefinition || {
    id: type,
    name: 'Workflow Group',
    category: { color: 'bg-gray-300' },
    icon: 'riFolderZipLine',
  }, [blockDefinition, type]);

  const handleGroupNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateData?.({ name: event.target.value });
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const droppedBlockStr = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('block');
      if (!droppedBlockStr) return;

      const droppedBlock = JSON.parse(droppedBlockStr);
      // Logic from Vue: if (excludeGroupBlocks.includes(id)) ...
      // For now, just add it. A real implementation needs more validation.
      // Also, if droppedBlock.fromGroup is true, it means it's being reordered from another group or within.

      if (droppedBlock.fromGroup) { // Reordering from another group (or within, if not handled by dnd library)
        // This simple version doesn't handle reordering well without a library.
        // It would also require removing from the source if it's a different group.
        console.log("Reordering/moving existing group item - complex, needs dnd library", droppedBlock);
        return;
      }

      const newBlockItem: GroupedBlockItem = {
        itemId: `item-${Date.now()}`, // nanoid(5) in Vue
        id: droppedBlock.id, // block definition ID
        data: droppedBlock.data || {},
        name: droppedBlock.name || tasksRegistry[droppedBlock.id]?.name || droppedBlock.id,
        icon: droppedBlock.icon || tasksRegistry[droppedBlock.id]?.icon || 'riQuestionMark',
        description: droppedBlock.data?.description || '',
      };
      onUpdateData?.({ blocks: [...blocks, newBlockItem] });

      // If the original block was on the main canvas and should be deleted
      // This requires communication back to WorkflowEditor
      // if (droppedBlock.blockId) { /* props.editor.removeNodes([droppedBlock.blockId]) */ }

    } catch (e) {
      console.error("Error handling drop:", e);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault(); // Necessary to allow drop
  };

  const blockBaseProps: BlockBaseProps = {
    blockId: instanceId,
    data: { disableBlock, $breakpoint, ...data },
    blockData: { details: { id: definition.id, name: definition.name, icon: definition.icon } },
    onDelete,
    onEdit,
    onSettings,
    onUpdate: onUpdateData,
    selected,
    contentClass: '!p-0', // Override padding from BlockBase
  };

  return (
    <BlockBase {...blockBaseProps} className="block-group w-72"> {/* w-64 in vue */}
      <Handle type="target" position={Position.Left} id={`${instanceId}-input-1`} style={{ background: '#555' }} />
      <div className="p-3">
        <div className="flex items-center mb-2">
          <div className={`mr-2 inline-flex items-center rounded-lg p-1.5 text-xs dark:text-black ${disableBlock ? 'bg-gray-400' : definition.category?.color}`}>
            <RemixIcon name={definition.icon || 'riFolderZipLine'} size="18" className="mr-1" />
            <span>{t('workflow.blocks.blocks-group.name', 'Workflow Group')}</span>
          </div>
        </div>
        <input
          value={groupName}
          placeholder={t('workflow.blocks.blocks-group.groupName', 'Group name')}
          type="text"
          className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 border rounded p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
          onChange={handleGroupNameChange}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>

      <div
        className="nowheel scroll max-h-60 space-y-1 overflow-auto px-3 pb-3 text-sm"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={(e) => e.stopPropagation()} // Prevent BlockBase drag start
      >
        {blocks.map((item, index) => (
          <div
            key={item.itemId}
            className="bg-gray-100 dark:bg-gray-700/80 group flex items-center space-x-2 rounded-md p-1.5 cursor-grab"
            draggable // Basic draggable attribute
            onDragStart={(e) => { // Very basic drag start, proper dnd library needed
                e.dataTransfer.setData('application/json', JSON.stringify({...item, fromGroup: true, groupInstanceId: instanceId, itemIndex: index }));
                e.stopPropagation();
            }}
          >
            <RemixIcon name={item.icon || tasksRegistry[item.id]?.icon || 'riQuestionMark'} size="18" className="shrink-0" />
            <div className="flex-1 overflow-hidden leading-tight">
              <p className="text-xs font-medium truncate">{item.name || tasksRegistry[item.id]?.name || item.id}</p>
              {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>}
            </div>
            <div className="invisible group-hover:visible flex items-center space-x-1">
              {/* Add breakpoint, edit, settings, delete buttons for item here */}
              {/* Example: */}
              <button title="Edit" onClick={() => onEditGroupItem?.(item)}><RemixIcon name="riPencilLine" size="16" /></button>
              <button title="Settings" onClick={() => onSettingsGroupItem?.(item)}><RemixIcon name="riSettings3Line" size="16" /></button>
              <button title="Delete" onClick={() => onDeleteGroupItem?.(item.itemId)}><RemixIcon name="riDeleteBin7Line" size="16" /></button>
            </div>
          </div>
        ))}
        <div className="mt-1 rounded-md border border-dashed border-gray-400 dark:border-gray-500 p-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('workflow.blocks.blocks-group.dropText', 'Drop blocks here')}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id={`${instanceId}-output-1`} style={{ background: '#555' }} />
    </BlockBase>
  );
};

export default BlockGroup;
