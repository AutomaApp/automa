<template>
  <div :id="componentId" class="p-4">
    <div class="flex items-center">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon name="riAB" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.conditions.name') }}</span>
      </div>
      <div class="flex-grow"></div>
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
    </div>
    <div
      v-if="block.data.conditions && block.data.conditions.length !== 0"
      class="mt-4 space-y-2"
    >
      <div
        v-for="(item, index) in block.data.conditions"
        :key="item.id"
        class="flex items-center group justify-end"
      >
        <v-remixicon
          name="riDeleteBin7Line"
          class="mr-2 cursor-pointer group-hover:visible invisible"
          @click="deleteCondition(index)"
        />
        <div
          class="flex items-center flex-1 p-2 bg-box-transparent rounded-lg overflow-hidden w-44"
        >
          <p class="w-5/12 text-overflow text-right">
            {{ item.compareValue || '_____' }}
          </p>
          <p class="w-2/12 text-center mx-1 font-mono">
            {{ item.type }}
          </p>
          <p class="w-5/12 text-overflow">
            {{ item.value || '_____' }}
          </p>
        </div>
      </div>
      <p
        v-if="block.data.conditions && block.data.conditions.length !== 0"
        class="text-right text-gray-600"
      >
        <span :title="t('workflow.blocks.conditions.fallbackTitle')">
          &#9432;
        </span>
        {{ t('common.fallback') }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { watch, toRaw, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import emitter from 'tiny-emitter/instance';
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
function deleteCondition(index) {
  block.data.conditions.splice(index, 1);

  deleteConditionEmit({ index, id: block.id });
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

onBeforeUnmount(() => {
  emitter.off('conditions-block:add', addConditionEmit);
  emitter.off('conditions-block:delete', deleteConditionEmit);
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
