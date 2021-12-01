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
      <ui-button
        :disabled="block.data.conditions && block.data.conditions.length > 4"
        icon
        variant="accent"
        style="height: 37px; width: 37px"
        @click="addComparison"
      >
        <v-remixicon name="riAddLine" class="inline-block" />
      </ui-button>
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
          class="mr-2 invisible group-hover:visible cursor-pointer"
          @click="deleteComparison(index)"
        />
        <div class="flex items-center transition bg-input rounded-lg">
          <select
            v-model="block.data.conditions[index].type"
            :title="getTitle(index)"
            class="
              bg-transparent
              font-mono
              z-10
              p-2
              text-center
              transition
              rounded-l-lg
              appearance-none
            "
          >
            <option
              v-for="(name, type) in conditions"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
          <div class="bg-gray-300 w-px" style="height: 30px"></div>
          <input
            v-model="block.data.conditions[index].value"
            type="text"
            placeholder="value"
            class="p-2 flex-1 transition rounded-r-lg bg-transparent w-36"
          />
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
import { watch, toRaw } from 'vue';
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

const conditions = {
  '==': 'equals',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
  '()': 'contains',
};

function getTitle(index) {
  const type = conditions[block.data.conditions[index]?.type] || 'equals';

  return t(`workflow.blocks.conditions.${type}`);
}
function addComparison() {
  if (block.data.conditions.length >= 10) return;

  block.data.conditions.push({ type: '==', value: '' });

  if (block.data.conditions.length === 1) props.editor.addNodeOutput(block.id);

  props.editor.addNodeOutput(block.id);
}
function deleteComparison(index) {
  block.data.conditions.splice(index, 1);

  props.editor.removeNodeOutput(block.id, `output_${index + 1}`);
  if (block.data.conditions.length === 0)
    props.editor.removeNodeOutput(block.id, `output_1`);
}

watch(
  () => block.data.conditions,
  debounce((newValue, oldValue) => {
    props.editor.updateNodeDataFromId(block.id, {
      conditions: toRaw(newValue),
    });

    props.editor.updateConnectionNodes(`node-${block.id}`);

    if (oldValue) {
      emitter.emit('editor:data-changed', block.id);
    }
  }, 250),
  { deep: true }
);
</script>
<style>
.drawflow .drawflow-node.conditions .outputs {
  top: 82px !important;
  transform: none !important;
}
.drawflow .drawflow-node.conditions .output {
  margin-bottom: 32px;
}
.drawflow .drawflow-node.conditions .output:nth-last-child(2) {
  margin-bottom: 20px;
}
</style>
