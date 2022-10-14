<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="w-64"
    content-class="p-0"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="p-4">
      <div class="flex items-center mb-2">
        <div
          :class="
            data.disableBlock ? 'bg-box-transparent' : block.category.color
          "
          class="inline-flex items-center text-sm mr-4 p-2 rounded-lg dark:text-black"
        >
          <v-remixicon
            :name="block.details.icon || 'riFolderZipLine'"
            size="20"
            class="inline-block mr-2"
          />
          <span>{{ t('workflow.blocks.blocks-group.name') }}</span>
        </div>
      </div>
      <input
        :value="data.name"
        :placeholder="t('workflow.blocks.blocks-group.groupName')"
        type="text"
        class="bg-transparent w-full focus:ring-0"
        @input="$emit('update', { name: $event.target.value })"
      />
    </div>
    <draggable
      :model-value="blocks"
      item-key="itemId"
      class="px-4 pb-4 overflow-auto nowheel scroll text-sm space-y-1 max-h-60"
      @mousedown.stop
      @dragover.prevent
      @drop="handleDrop"
      @update:modelValue="$emit('update', { blocks: $event })"
    >
      <template #item="{ element, index }">
        <div
          class="p-2 rounded-lg bg-input space-x-2 flex items-center group"
          style="cursor: grab"
          @dragstart="onDragStart(element, $event)"
          @dragend="onDragEnd(element.itemId)"
        >
          <v-remixicon
            :name="tasks[element.id].icon"
            size="20"
            class="flex-shrink-0"
          />
          <div class="leading-tight flex-1 overflow-hidden">
            <p class="text-overflow">
              {{
                getTranslation(
                  `workflow.blocks.${element.id}.name`,
                  tasks[element.id].name
                )
              }}
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
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
  </block-base>
</template>
<script setup>
import { inject, computed, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import { useToast } from 'vue-toastification';
import { Handle, Position } from '@vue-flow/core';
import draggable from 'vuedraggable';
import { tasks, excludeGroupBlocks } from '@/utils/shared';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';
import BlockBase from './BlockBase.vue';

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
  events: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update', 'delete', 'edit', 'settings']);

const { t, te } = useI18n();
const toast = useToast();
const componentId = useComponentId('blocks-group');
const block = useEditorBlock(props.label);

const workflow = inject('workflow', {});

const blocks = computed(() =>
  Array.isArray(props.data.blocks)
    ? props.data.blocks
    : Object.values(props.data.blocks)
);

function onDragStart(item, event) {
  event.dataTransfer.setData(
    'block',
    JSON.stringify({ ...tasks[item.id], ...item, fromGroup: true })
  );
}
function onDragEnd(itemId) {
  setTimeout(() => {
    const blockEl = document.querySelector(`[group-item-id="${itemId}"]`);

    if (blockEl) {
      const blockIndex = blocks.value.findIndex(
        (item) => item.itemId === itemId
      );

      if (blockIndex !== -1) {
        const copyBlocks = [...props.data.blocks];
        copyBlocks.splice(blockIndex, 1);
        emit('update', { blocks: copyBlocks });
      }
    }
  }, 200);
}
function editBlock(payload) {
  emit('edit', payload);
}
function deleteItem(index, itemId) {
  const copyBlocks = [...props.data.blocks];

  if (workflow.editState.blockData.itemId === itemId) {
    workflow.editState.editing = false;
    workflow.editState.blockData = false;
  }

  copyBlocks.splice(index, 1);
  emit('update', { blocks: copyBlocks });
}
function getTranslation(key, defText = '') {
  return te(key) ? t(key) : defText;
}
function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const droppedBlock = JSON.parse(event.dataTransfer.getData('block') || null);
  if (!droppedBlock || droppedBlock.fromGroup) return;

  const { id, data, blockId } = droppedBlock;

  if (excludeGroupBlocks.includes(id)) {
    toast.error(
      t('workflow.blocks.blocks-group.cantAdd', {
        blockName: t(`workflow.blocks.${id}.name`),
      })
    );

    return;
  }

  if (blockId) {
    emit('delete', blockId);
  }

  const copyBlocks = [
    ...props.data.blocks,
    shallowReactive({ id, data, itemId: nanoid(5) }),
  ];
  emit('update', { blocks: copyBlocks });
}
</script>
