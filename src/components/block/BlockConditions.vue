<template>
  <div :id="componentId" class="p-4" @dblclick="editBlock">
    <div class="flex items-center">
      <div
        :class="
          block.data.disableBlock ? 'bg-box-transparent' : block.category.color
        "
        class="inline-block text-sm mr-4 p-2 rounded-lg dark:text-black"
      >
        <v-remixicon name="riAB" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.conditions.name') }}</span>
      </div>
      <div class="flex-grow"></div>
      <template v-if="!editor.minimap">
        <v-remixicon
          name="riDeleteBin7Line"
          class="cursor-pointer mr-2"
          @click="editor.removeNodeId(`node-${block.id}`)"
        />
        <v-remixicon
          name="riPencilLine"
          class="inline-block cursor-pointer"
          @click="editBlock"
        />
      </template>
    </div>
    <ul
      v-if="block.data.conditions && block.data.conditions.length !== 0"
      class="mt-4 space-y-2"
    >
      <li
        v-for="item in block.data.conditions"
        :key="item.id"
        class="flex items-center flex-1 p-2 bg-box-transparent rounded-lg overflow-hidden w-44"
      >
        <p
          v-if="item.name"
          class="text-overflow w-full text-right"
          :title="item.name"
        >
          {{ item.name }}
        </p>
        <template v-else>
          <p class="w-5/12 text-overflow text-right">
            {{ item.compareValue || '_____' }}
          </p>
          <p class="w-2/12 text-center mx-1 font-mono">
            {{ item.type }}
          </p>
          <p class="w-5/12 text-overflow">
            {{ item.value || '_____' }}
          </p>
        </template>
      </li>
      <p
        v-if="block.data.conditions && block.data.conditions.length !== 0"
        class="text-right text-gray-600 dark:text-gray-200"
      >
        <span title="Fallback"> &#9432; </span>
        Fallback
      </p>
    </ul>
    <input class="trigger hidden" @change="onChange" />
  </div>
</template>
<script setup>
import { watch, toRaw, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import emitter from '@/lib/mitt';
import { debounce } from '@/utils/helper';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const componentId = useComponentId('block-conditions');
const block = useEditorBlock(`#${componentId}`, props.editor);

function onChange({ detail }) {
  block.data.disableBlock = detail.disableBlock;

  if (detail.conditions) {
    block.data.conditions = detail.conditions;
  }
}
function editBlock() {
  emitter.emit('editor:edit-block', {
    ...block.details,
    data: block.data,
    blockId: block.id,
  });
}
function addConditionEmit({ id }) {
  if (id !== block.id) return;

  const { length } = block.data.conditions;

  if (length >= 10) return;
  if (length === 0) props.editor.addNodeOutput(block.id);

  props.editor.addNodeOutput(block.id);
}
function deleteConditionEmit({ index, id }) {
  if (id !== block.id) return;

  props.editor.removeNodeOutput(block.id, `output_${index + 1}`);

  if (block.data.conditions.length === 0)
    props.editor.removeNodeOutput(block.id, `output_1`);
}
function refreshConnections({ id }) {
  if (id !== block.id) return;

  const node = props.editor.getNodeFromId(block.id);
  const outputs = Object.keys(node.outputs);
  const conditionsLen = block.data.conditions.length + 1;

  if (outputs.length > conditionsLen) {
    const diff = outputs.length - conditionsLen;

    for (let index = 0; index < diff; index += 1) {
      const output = outputs[outputs.length - 2 - index];

      props.editor.removeNodeOutput(block.id, output);
    }
  }
}

watch(
  () => block.data.conditions,
  debounce((newValue, oldValue) => {
    props.editor.updateNodeDataFromId(block.id, {
      conditions: toRaw(newValue),
    });

    props.editor.updateConnectionNodes(`node-${block.id}`);

    if (!oldValue) return;

    emitter.emit('editor:data-changed', block.id);
  }, 250),
  { deep: true }
);

emitter.on('conditions-block:add', addConditionEmit);
emitter.on('conditions-block:delete', deleteConditionEmit);
emitter.on('conditions-block:refresh', refreshConnections);

onBeforeUnmount(() => {
  emitter.off('conditions-block:add', addConditionEmit);
  emitter.off('conditions-block:delete', deleteConditionEmit);
  emitter.off('conditions-block:refresh', refreshConnections);
});
</script>
<style>
.drawflow .drawflow-node.conditions .outputs {
  top: 82px !important;
  transform: none !important;
}
.drawflow .drawflow-node.conditions .output {
  margin-bottom: 30px;
}
.drawflow .drawflow-node.conditions .output:nth-last-child(2) {
  margin-bottom: 22px;
}
</style>
