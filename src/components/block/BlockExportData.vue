<template>
  <div :id="componentId" class="p-4">
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon
          :path="icons.riDownloadLine"
          size="20"
          class="inline-block mr-1"
        />
        <span>Export data</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        :path="icons.riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <select
      :value="block.data.type"
      class="px-4 py-2 rounded-lg w-40 bg-input"
      required
      @input="handleInput"
    >
      <option v-for="type in exportTypes" :key="type.id" :value="type.id">
        {{ type.name }}
      </option>
    </select>
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

const exportTypes = [
  { name: 'JSON', id: 'json' },
  { name: 'CSV', id: 'csv' },
  { name: 'Plain text', id: 'plain-text' },
];

function handleInput({ target }) {
  props.editor.updateNodeDataFromId(block.id, { type: target.value });
  emitter.emit('editor:data-changed', block.id);
}
</script>
