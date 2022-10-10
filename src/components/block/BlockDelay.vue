<template>
  <ui-card :id="componentId" class="p-4 w-48 block-basic">
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg dark:text-black"
      >
        <v-remixicon name="riTimerLine" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.delay.name') }}</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer"
        @click.stop="$emit('delete', id)"
      />
    </div>
    <input
      :value="data.time"
      min="0"
      :title="t('workflow.blocks.delay.input.title')"
      :placeholder="t('workflow.blocks.delay.input.placeholder')"
      class="px-4 py-2 w-full rounded-lg bg-input"
      type="text"
      required
      @input="$emit('update', { time: $event.target.value })"
    />
    <div
      v-if="block.details.id !== 'trigger'"
      :title="t('workflow.blocks.base.moveToGroup')"
      draggable="true"
      class="bg-white dark:bg-gray-700 invisible move-to-group z-50 absolute -top-2 -right-2 rounded-md p-1 shadow-md"
      @dragstart="handleStartDrag"
      @mousedown.stop
    >
      <v-remixicon name="riDragDropLine" size="20" />
    </div>
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
  </ui-card>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { Handle, Position } from '@vue-flow/core';
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
});
defineEmits(['update', 'delete']);

const { t } = useI18n();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-delay');

function handleStartDrag(event) {
  const payload = {
    id: props.label,
    data: props.data,
    blockId: props.id,
    fromBlockBasic: true,
  };

  event.dataTransfer.setData('block', JSON.stringify(payload));
}
</script>
