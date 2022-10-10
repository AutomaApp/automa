<template>
  <ui-card :id="componentId" class="p-4 repeat-task w-64">
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg dark:text-black"
      >
        <v-remixicon name="riRepeat2Line" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.repeat-task.name') }}</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer"
        @click="$emit('delete', id)"
      />
    </div>
    <div class="flex bg-input rounded-lg items-center relative">
      <input
        :value="data.repeatFor"
        placeholder="0"
        class="bg-transparent py-2 px-4 focus:ring-0"
        required
        style="padding-right: 57px; width: 95%"
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
  </ui-card>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { Handle, Position } from '@vue-flow/core';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

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
const emit = defineEmits(['delete', 'update']);

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
