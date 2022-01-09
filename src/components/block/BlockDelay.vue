<template>
  <div :id="componentId" class="p-4">
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon name="riTimerLine" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.delay.name') }}</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <input
      :value="block.data.time"
      min="0"
      :title="t('workflow.blocks.delay.input.title')"
      :placeholder="t('workflow.blocks.delay.input.placeholder')"
      class="px-4 py-2 rounded-lg w-36 bg-input"
      type="number"
      required
      @input="handleInput"
    />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import emitter from '@/lib/mitt';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const componentId = useComponentId('block-delay');
const block = useEditorBlock(`#${componentId}`, props.editor);

function handleInput({ target }) {
  target.reportValidity();

  const time = +target.value || 0;

  if (time < 0) return;

  props.editor.updateNodeDataFromId(block.id, { time });
  emitter.emit('editor:data-changed', block.id);
}
</script>
