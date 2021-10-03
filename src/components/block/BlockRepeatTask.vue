<template>
  <div :id="componentId" class="p-4 repeat-task">
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon
          :path="icons.riRepeat2Line"
          size="20"
          class="inline-block mr-1"
        />
        <span>Repeat task</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        :path="icons.riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <label
      class="
        mb-2
        block
        bg-input
        focus-within:bg-input
        pr-4
        transition
        rounded-lg
      "
    >
      <input
        :value="block.data.repeatFor || 0"
        min="0"
        class="pl-4 py-2 bg-transparent rounded-l-lg w-28 mr-2"
        type="number"
        required
        @input="handleInput"
      />
      <span class="text-gray-600">Times</span>
    </label>
    <p class="text-right text-gray-600">Repeat from</p>
  </div>
</template>
<script setup>
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import { icons } from '@/lib/v-remixicon';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const componentId = useComponentId('block-delay');
const block = useEditorBlock(`#${componentId}`, props.editor);

function handleInput({ target }) {
  target.reportValidity();

  const repeatFor = +target.value || 0;

  if (repeatFor < 0) return;

  props.editor.updateNodeDataFromId(block.id, { repeatFor });
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
