<template>
  <div :id="componentId" class="p-4">
    <div class="flex items-center">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon :path="icons.riAB" size="20" class="inline-block mr-1" />
        <span>Comparison</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        :path="icons.riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
      <button
        :disabled="block.data.comparison && block.data.comparison.length > 4"
        class="bg-accent ml-2 rounded-lg text-white text-center"
        style="height: 37px; width: 37px"
        @click="addComparison"
      >
        <v-remixicon :path="icons.riAddLine" class="inline-block" />
      </button>
    </div>
    <div
      v-if="block.data.comparison && block.data.comparison.length !== 0"
      class="mt-4 space-y-2"
    >
      <div
        v-for="(item, index) in block.data.comparison"
        :key="item.id"
        class="flex items-center group justify-end"
      >
        <v-remixicon
          :path="icons.riDeleteBin7Line"
          class="mr-2 invisible group-hover:visible cursor-pointer"
          @click="deleteComparison(index)"
        />
        <div class="flex items-center transition bg-input rounded-lg">
          <select
            v-model="block.data.comparison[index].type"
            :title="conditions[block.data.comparison[index]?.type] || 'Equals'"
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
            v-model="block.data.comparison[index].value"
            type="text"
            placeholder="value"
            class="p-2 flex-1 transition rounded-r-lg bg-transparent w-36"
          />
        </div>
      </div>
      <p
        v-if="block.data.comparison && block.data.comparison.length !== 0"
        class="text-right text-gray-600"
      >
        <span title="Execute when all comparisons don't meet the requirement"
          >&#9432;</span
        >
        Fallback
      </p>
    </div>
  </div>
</template>
<script setup>
import { watch, toRaw } from 'vue';
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import { nanoid } from 'nanoid';
import { debounce } from '@/utils/helper';
import { icons } from '@/lib/v-remixicon';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const componentId = useComponentId('block-comparison');
const block = useEditorBlock(`#${componentId}`, props.editor);

const conditions = {
  '==': 'Equals',
  '>': 'Greater than',
  '>=': 'Greater than or equal',
  '<': 'Less than',
  '<=': 'Less than or equal',
};

function addComparison() {
  if (block.data.comparison.length >= 5) return;

  block.data.comparison.push({ id: nanoid(6), type: '==', value: '' });

  if (block.data.comparison.length === 1) props.editor.addNodeOutput(block.id);

  props.editor.addNodeOutput(block.id);
}
function deleteComparison(index) {
  block.data.comparison.splice(index, 1);

  props.editor.removeNodeOutput(block.id, `output_${index + 1}`);
  if (block.data.comparison.length === 0)
    props.editor.removeNodeOutput(block.id, `output_1`);
}

watch(
  () => block.data.comparison,
  debounce((newValue) => {
    props.editor.updateNodeDataFromId(block.id, {
      comparison: toRaw(newValue),
    });

    props.editor.updateConnectionNodes(`node-${block.id}`);
  }, 250),
  { deep: true }
);
</script>
