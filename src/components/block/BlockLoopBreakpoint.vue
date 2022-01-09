<template>
  <div :id="componentId" class="p-4">
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon name="riStopLine" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.loop-breakpoint.name') }}</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <input
      :value="block.data.loopId"
      class="px-4 py-2 rounded-lg w-48 bg-input"
      placeholder="Loop ID"
      type="text"
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
  const loopId = target.value.replace(/\s/g, '');

  props.editor.updateNodeDataFromId(block.id, { loopId });
  emitter.emit('editor:data-changed', block.id);
}
</script>
