<template>
  <div :id="componentId" class="w-64">
    <div class="p-4">
      <div class="flex items-center mb-2">
        <div
          :class="block.category.color"
          class="inline-flex items-center text-sm mr-4 p-2 rounded-lg"
        >
          <v-remixicon
            :name="block.details.icon || 'riFolderZipLine'"
            size="20"
            class="inline-block mr-2"
          />
          <span>{{ t('workflow.blocks.blocks-group.name') }}</span>
        </div>
        <div class="flex-grow"></div>
        <v-remixicon
          name="riDeleteBin7Line"
          class="cursor-pointer"
          @click="editor.removeNodeId(`node-${block.id}`)"
        />
      </div>
      <input
        v-model="block.data.name"
        :placeholder="t('workflow.blocks.blocks-group.groupName')"
        type="text"
        class="bg-transparent w-full focus:ring-0"
      />
    </div>
    <draggable
      v-model="block.data.blocks"
      item-key="itemId"
      class="px-4 mb-4 overflow-auto scroll text-sm space-y-1 max-h-60"
      @mousedown.stop
      @dragover.prevent
      @drop="handleDrop"
    >
      <template #item="{ element, index }">
        <div
          class="p-2 rounded-lg bg-input space-x-2 flex items-center group"
          style="cursor: grab"
        >
          <v-remixicon
            :name="tasks[element.id].icon"
            size="20"
            class="flex-shrink-0"
          />
          <div class="leading-tight flex-1 overflow-hidden">
            <p class="text-overflow">
              {{ t(`workflow.blocks.${element.id}.name`) }}
            </p>
            <p
              :title="element.data.description"
              class="text-gray-600 dark:text-gray-200 text-overflow"
            >
              {{ element.data.description }}
            </p>
          </div>
          <div class="invisible group-hover:visible">
            <v-remixicon
              name="riPencilLine"
              size="20"
              class="cursor-pointer inline-block mr-2"
              @click="editBlock(element)"
            />
            <v-remixicon
              name="riDeleteBin7Line"
              size="20"
              class="cursor-pointer inline-block"
              @click="deleteItem(index, element.itemId)"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div
          class="p-2 rounded-lg text-gray-600 dark:text-gray-200 border text-center border-dashed"
        >
          {{ t('workflow.blocks.blocks-group.dropText') }}
        </div>
      </template>
    </draggable>
    <input class="hidden trigger" @change="handleDataChange" />
  </div>
</template>
<script setup>
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import draggable from 'vuedraggable';
import emitter from '@/lib/mitt';
import { tasks } from '@/utils/shared';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const componentId = useComponentId('blocks-group');
const block = useEditorBlock(`#${componentId}`, props.editor);

const excludeBlocks = [
  'trigger',
  'repeat-task',
  'export-data',
  'loop-data',
  'loop-breakpoint',
  'blocks-group',
  'conditions',
  'element-exists',
  'delay',
];

function handleDataChange({ detail }) {
  if (!detail) return;

  const itemIndex = block.data.blocks.findIndex(
    ({ itemId }) => itemId === detail.itemId
  );

  if (itemIndex === -1) return;

  block.data.blocks[itemIndex].data = detail.data;
}
function editBlock(payload) {
  emitter.emit('editor:edit-block', {
    ...tasks[payload.id],
    ...payload,
    isInGroup: true,
    blockId: block.id,
  });
}
function deleteItem(index, itemId) {
  emitter.emit('editor:delete-block', { itemId, isInGroup: true });
  block.data.blocks.splice(index, 1);
}
function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const droppedBlock = JSON.parse(event.dataTransfer.getData('block') || null);

  if (!droppedBlock) return;

  const { id, data } = droppedBlock;

  if (excludeBlocks.includes(id)) return;

  block.data.blocks.push({ id, data, itemId: nanoid(5) });
}

watch(
  () => block.data,
  (value, oldValue) => {
    if (Object.keys(oldValue).length === 0) return;

    props.editor.updateNodeDataFromId(block.id, value);
    emitter.emit('editor:data-changed', block.id);
  },
  { deep: true }
);
</script>
