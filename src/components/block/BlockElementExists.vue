<template>
  <div :id="componentId" class="p-4 element-exists">
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon
          :path="icons.riFocus3Line"
          size="20"
          class="inline-block mr-1"
        />
        <span>Element exists</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        :path="icons.riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <input
      :value="block.data.selector"
      class="px-4 py-2 rounded-lg w-48 mb-2 bg-input"
      placeholder="Element selector"
      required
      @input="handleInput"
    />
    <p class="text-right text-gray-600">
      <span title="Execute when element doesn't exists"> &#9432; </span>
      Fallback
    </p>
  </div>
</template>
<script setup>
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import emitter from 'tiny-emitter/instance';
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

  props.editor.updateNodeDataFromId(block.id, { selector: target.value });
  emitter.emit('editor:data-changed', block.id);
}
</script>
<style>
.drawflow .element-exists .outputs {
  top: 74px !important;
  transform: none !important;
}
.drawflow .element-exists .output {
  margin-bottom: 22px;
}
</style>
