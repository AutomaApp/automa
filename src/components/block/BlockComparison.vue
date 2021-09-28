<template>
  <div id="block-comparison" class="p-4">
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
        <span title="Blabla">&#9432;</span> Fallback
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
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const block = useEditorBlock('#block-comparison', props.editor);
const conditions = {
  '==': 'Equals',
  '>': 'Greater than',
  '>=': 'Greater than or equal',
  '<': 'Less than',
  '<=': 'Less than or equal',
};

function addComparison() {
  block.data.comparison.push({ id: nanoid(6), type: '==', value: '' });
}
function deleteComparison(index) {
  block.data.comparison.splice(index, 1);
}

watch(
  () => block.data.comparison,
  debounce((newValue) => {
    props.editor.updateNodeDataFromId(block.id, {
      comparison: toRaw(newValue),
    });
  }, 250),
  { deep: true }
);
</script>
