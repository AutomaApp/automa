<template>
  <ui-card :id="componentId" class="p-4 repeat-task">
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
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <label
      class="mb-2 block bg-input focus-within:bg-input pr-4 transition rounded-lg"
    >
      <input
        :value="data.repeatFor || 0"
        min="0"
        class="pl-4 py-2 bg-transparent rounded-l-lg w-24 mr-2"
        type="number"
        required
        @input="handleInput"
      />
      <span class="text-gray-600 dark:text-gray-200">
        {{ t('workflow.blocks.repeat-task.times') }}
      </span>
    </label>
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
import { Handle, Position } from '@braks/vue-flow';
import emitter from '@/lib/mitt';
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

const block = useEditorBlock(props.label);
const componentId = useComponentId('block-delay');

function handleInput({ target }) {
  target.reportValidity();

  const repeatFor = +target.value || 0;

  if (repeatFor < 0) return;

  props.editor.updateNodeDataFromId(props.id, { repeatFor });
  emitter.emit('editor:data-changed', props.id);
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
