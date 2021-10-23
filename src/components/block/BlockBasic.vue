<template>
  <block-base
    :id="componentId"
    :hide-edit="block.details.disableEdit"
    :hide-delete="block.details.disableDelete"
    content-class="flex items-center"
    @edit="editBlock"
    @delete="editor.removeNodeId(`node-${block.id}`)"
  >
    <span
      :class="block.category.color"
      class="inline-block p-2 mr-2 rounded-lg bg-green-200"
    >
      <v-remixicon :name="block.details.icon || 'riGlobalLine'" />
    </span>
    <div style="max-width: 200px">
      <p class="font-semibold leading-none whitespace-nowrap">
        {{ block.details.name }}
      </p>
      <p class="text-gray-600 text-overflow leading-tight">
        {{ block.data.description }}
      </p>
      <input
        type="text"
        class="hidden trigger"
        disabled="true"
        @change="handleDataChange"
      />
    </div>
  </block-base>
</template>
<script setup>
import emitter from 'tiny-emitter/instance';
import { useEditorBlock } from '@/composable/editorBlock';
import { useComponentId } from '@/composable/componentId';
import BlockBase from './BlockBase.vue';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const componentId = useComponentId('block-base');
const block = useEditorBlock(`#${componentId}`, props.editor);

function editBlock() {
  emitter.emit('editor:edit-block', {
    ...block.details,
    data: block.data,
    blockId: block.id,
  });
}
function handleDataChange() {
  const { data } = props.editor.getNodeFromId(block.id);

  block.data = data;
}
</script>
