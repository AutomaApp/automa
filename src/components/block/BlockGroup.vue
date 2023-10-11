<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="w-64"
    content-class="!p-0"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="p-4">
      <div class="mb-2 flex items-center">
        <div
          :class="
            data.disableBlock ? 'bg-box-transparent' : block.category.color
          "
          class="mr-4 inline-flex items-center rounded-lg p-2 text-sm dark:text-black"
        >
          <v-remixicon
            :name="block.details.icon || 'riFolderZipLine'"
            size="20"
            class="mr-2 inline-block"
          />
          <span>{{ t('workflow.blocks.blocks-group.name') }}</span>
        </div>
      </div>
      <input
        :value="data.name"
        :placeholder="t('workflow.blocks.blocks-group.groupName')"
        type="text"
        class="w-full bg-transparent focus:ring-0"
        @keydown.stop
        @input="$emit('update', { name: $event.target.value })"
      />
    </div>
    <draggable
      :model-value="blocks"
      item-key="itemId"
      class="nowheel scroll max-h-60 space-y-1 overflow-auto px-4 pb-4 text-sm"
      @mousedown.stop
      @dragover.prevent
      @drop="handleDrop"
      @update:modelValue="$emit('update', { blocks: $event })"
    >
      <template #item="{ element, index }">
        <div
          class="bg-input group flex items-center space-x-2 rounded-lg p-2"
          style="cursor: grab"
          :data-block-id="element.id"
          @dragstart="onDragStart(element, $event)"
          @dragend="onDragEnd(element.itemId)"
        >
          <v-remixicon
            :name="tasks[element.id].icon"
            size="20"
            class="shrink-0"
          />
          <div class="flex-1 overflow-hidden leading-tight">
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
              class="text-overflow text-gray-600 dark:text-gray-200"
            >
              {{ element.data.description }}
            </p>
          </div>
          <div class="invisible group-hover:visible">
            <v-remixicon
              v-if="workflow?.data?.value.testingMode"
              :class="{
                'text-red-500 dark:text-red-400': element.data.$breakpoint,
              }"
              title="Set as breakpoint"
              name="riRecordCircleLine"
              size="18"
              class="mr-2 inline-block cursor-pointer"
              @click="toggleBreakpoint(element, index)"
            />
            <v-remixicon
              name="riPencilLine"
              size="18"
              class="mr-2 inline-block cursor-pointer"
              @click="editBlock(element)"
            />
            <v-remixicon
              name="riSettings3Line"
              size="18"
              class="mr-2 inline-block cursor-pointer"
              @click="editItemSettings(element)"
            />
            <v-remixicon
              name="riDeleteBin7Line"
              size="18"
              class="inline-block cursor-pointer"
              @click="deleteItem(index, element.itemId)"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div
          class="rounded-lg border border-dashed p-2 text-center text-gray-600 dark:text-gray-200"
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

function editItemSettings(element) {
  emit('settings', {
    blockId: props.id,
    data: element.data,
    itemId: element.itemId,
    details: { id: element.id },
  });
}
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
function toggleBreakpoint(item, index) {
  const copyBlocks = [...props.data.blocks];
  copyBlocks[index].data = {
    ...copyBlocks[index].data,
    $breakpoint: !item.data.$breakpoint,
  };

  emit('update', { blocks: copyBlocks });
}
</script>
