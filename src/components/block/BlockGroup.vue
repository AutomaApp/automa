<template>
  <ui-card :id="componentId" class="w-64" padding="p-0">
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="p-4">
      <div class="flex items-center mb-2">
        <div
          :class="block.category.color"
          class="inline-flex items-center text-sm mr-4 p-2 rounded-lg dark:text-black"
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
          @click.stop="emit('delete', id)"
        />
      </div>
      <input
        :model-value="data.name"
        :placeholder="t('workflow.blocks.blocks-group.groupName')"
        type="text"
        class="bg-transparent w-full focus:ring-0"
        @input="$emit('update', { name: $event.target.value })"
      />
    </div>
    <draggable
      v-model="state.blocks"
      item-key="itemId"
      class="px-4 pb-4 overflow-auto nowheel scroll text-sm space-y-1 max-h-60"
      @mousedown.stop
      @dragover.prevent
      @drop="handleDrop"
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
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
  </ui-card>
</template>
<script setup>
import { watch, reactive, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import { useToast } from 'vue-toastification';
import { Handle, Position } from '@braks/vue-flow';
import cloneDeep from 'lodash.clonedeep';
import draggable from 'vuedraggable';
import { tasks } from '@/utils/shared';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

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
});
const emit = defineEmits(['update', 'delete', 'edit']);

const excludeBlocks = [
  'trigger',
  'repeat-task',
  'loop-data',
  'loop-breakpoint',
  'blocks-group',
  'conditions',
  'webhook',
  'element-exists',
];

const { t } = useI18n();
const toast = useToast();
const componentId = useComponentId('blocks-group');
const block = useEditorBlock(props.label);

const state = reactive({
  blocks: [],
  retrieved: false,
});

const workflow = inject('workflow');

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
      const blockIndex = state.blocks.findIndex(
        (item) => item.itemId === itemId
      );

      if (blockIndex !== -1) {
        state.blocks.splice(blockIndex, 1);
      }
    }
  }, 200);
}
function editBlock(payload) {
  emit('edit', payload);
}
function deleteItem(index, itemId) {
  if (workflow.editState.blockData.itemId === itemId) {
    workflow.editState.editing = false;
    workflow.editState.blockData = false;
  }

  state.blocks.splice(index, 1);
}
function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const droppedBlock = JSON.parse(event.dataTransfer.getData('block') || null);
  if (!droppedBlock || droppedBlock.fromGroup) return;

  const { id, data, blockId } = droppedBlock;

  if (excludeBlocks.includes(id)) {
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

  state.blocks.push({ id, data, itemId: nanoid(5) });
}

watch(
  () => state.blocks,
  () => {
    if (!state.retrieved) return;
    emit('update', { blocks: state.blocks });
  },
  { deep: true }
);

onMounted(() => {
  const copiedBlocks = cloneDeep(props.data.blocks);
  state.blocks = Array.isArray(copiedBlocks)
    ? copiedBlocks
    : Object.values(copiedBlocks);

  setTimeout(() => {
    state.retrieved = true;
  }, 500);
});
</script>
