<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="repeat-task w-64"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="flex items-center mb-2">
      <div
        :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg dark:text-black"
      >
        <v-remixicon name="riRepeat2Line" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.repeat-task.name') }}</span>
      </div>
    </div>
    <div class="flex bg-input rounded-lg items-center relative">
      <input
        :value="data.repeatFor"
        placeholder="0"
        class="bg-transparent py-2 px-4 focus:ring-0"
        style="padding-right: 57px; width: 95%"
        @keydown.stop
        @input="handleInput"
      />
      <span class="text-gray-600 dark:text-gray-200 absolute right-4">
        {{ t('workflow.blocks.repeat-task.times') }}
      </span>
    </div>
    <p class="text-right text-gray-600 dark:text-gray-200">
      {{ t('workflow.blocks.repeat-task.repeatFrom') }}
    </p>
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
    <Handle
      :id="`${id}-output-2`"
      type="source"
      :position="Position.Right"
      style="top: auto; bottom: 12px"
    />
  </block-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { Handle, Position } from '@vue-flow/core';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';
import BlockBase from './BlockBase.vue';

const { t } = useI18n();
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
const emit = defineEmits(['delete', 'update', 'settings']);

const block = useEditorBlock(props.label);
const componentId = useComponentId('block-delay');

function handleInput({ target }) {
  emit('update', { repeatFor: target.value });
}
</script>
<style>
.drawflow .repeat-task .outputs {
  top: 74px !important;
  transform: none !important;
}
.drawflow .repeat-task .output {
  margin-bottom: 22px;
}
</style>
