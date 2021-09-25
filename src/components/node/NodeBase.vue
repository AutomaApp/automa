<template>
  <div ref="rootRef" class="group relative">
    <div
      class="
        z-10
        flex
        items-center
        bg-white
        relative
        rounded-lg
        overflow-hidden
        p-4
      "
    >
      <span class="inline-block p-2 mr-2 rounded-lg bg-green-200">
        <v-remixicon :path="riCursorLine" />
      </span>
      <p>Click element</p>
    </div>
    <div
      class="
        absolute
        top-0
        transition-transform
        duration-300
        group-hover:translate-y-16
        pt-4
        menu
      "
    >
      <div class="bg-accent px-4 py-2 text-white rounded-lg flex items-center">
        <button class="-ml-1">
          <v-remixicon size="20" :path="riPencilLine" />
        </button>
        <hr class="border-r border-gray-600 h-5 mx-3" />
        <button class="-mr-1">
          <v-remixicon size="20" :path="riDeleteBin7Line" />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, nextTick } from 'vue';
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import {
  riCursorLine,
  riDeleteBin7Line,
  riPencilLine,
} from 'v-remixicon/icons';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const rootRef = ref(null);
const nodeId = ref('');

nextTick(() => {
  nodeId.value = rootRef.value?.parentElement.parentElement.id;
  console.log(rootRef.value?.parentElement.parentElement);
  if (nodeId.value) {
    console.log(props.editor);
  }
});
</script>
