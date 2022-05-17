<template>
  <div :id="componentId" class="p-4 block-basic">
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
        v-if="!editor.minimap"
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
      type="text"
      required
      @input="handleInput"
    />
    <div
      v-if="!editor.minimap && block.details.id !== 'trigger'"
      :title="t('workflow.blocks.base.moveToGroup')"
      draggable="true"
      class="bg-white dark:bg-gray-700 invisible move-to-group z-50 absolute -top-2 -right-2 rounded-md p-1 shadow-md"
      @dragstart="handleStartDrag"
      @mousedown.stop
    >
      <v-remixicon name="riDragDropLine" size="20" />
    </div>
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
  props.editor.updateNodeDataFromId(block.id, { time: target.value });
  emitter.emit('editor:data-changed', block.id);
}
function handleStartDrag(event) {
  const payload = {
    data: block.data,
    id: block.details.id,
    blockId: block.id,
    fromBlockBasic: true,
  };

  event.dataTransfer.setData('block', JSON.stringify(payload));
}
</script>
