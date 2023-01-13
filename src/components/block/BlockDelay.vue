<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="w-48"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="mb-2 flex items-center">
      <div
        :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
        class="mr-4 inline-block rounded-lg p-2 text-sm dark:text-black"
      >
        <v-remixicon name="riTimerLine" size="20" class="mr-1 inline-block" />
        <span>{{ t('workflow.blocks.delay.name') }}</span>
      </div>
      <div class="grow"></div>
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
      class="bg-input w-full rounded-lg px-4 py-2"
      type="text"
      required
      @keydown.stop
      @input="$emit('update', { time: $event.target.value })"
    />
    <div
      v-if="block.details.id !== 'trigger'"
      :title="t('workflow.blocks.base.moveToGroup')"
      draggable="true"
      class="move-to-group invisible absolute -top-2 -right-2 z-50 rounded-md bg-white p-1 shadow-md dark:bg-gray-700"
      @dragstart="handleStartDrag"
      @mousedown.stop
    >
      <v-remixicon name="riDragDropLine" size="20" />
    </div>
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
  </block-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { Handle, Position } from '@vue-flow/core';
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
});
defineEmits(['update', 'delete', 'settings']);

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
