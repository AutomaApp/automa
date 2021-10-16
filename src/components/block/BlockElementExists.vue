<template>
  <block-base
    :id="componentId"
    class="element-exists"
    @edit="editBlock"
    @delete="editor.removeNodeId(`node-${block.id}`)"
  >
    <div
      :class="block.category.color"
      class="inline-block text-sm mb-2 p-2 rounded-lg"
    >
      <v-remixicon
        :path="icons.riFocus3Line"
        size="20"
        class="inline-block mr-1"
      />
      <span>Element exists</span>
    </div>
    <p
      title="Element selector"
      class="
        text-overflow
        p-2
        rounded-lg
        bg-box-transparent
        text-sm
        font-mono
        text-right
        mb-2
      "
      style="max-width: 200px"
    >
      {{ block.data.selector || 'Element selector' }}
    </p>
    <p class="text-right text-gray-600">
      <span title="Execute when element doesn't exists"> &#9432; </span>
      Fallback
    </p>
    <input
      type="text"
      class="hidden trigger"
      disabled="true"
      @change="handleDataChanged"
    />
  </block-base>
</template>
<script setup>
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import emitter from 'tiny-emitter/instance';
import BlockBase from './BlockBase.vue';
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

function editBlock() {
  emitter.emit('editor:edit-block', {
    ...block.details,
    data: block.data,
    blockId: block.id,
  });
}
function handleDataChanged() {
  const { data } = props.editor.getNodeFromId(block.id);

  block.data = data;
}
</script>
<style>
.drawflow .element-exists .outputs {
  top: 70px !important;
  transform: none !important;
}
.drawflow .element-exists .output {
  margin-bottom: 22px;
}
</style>
