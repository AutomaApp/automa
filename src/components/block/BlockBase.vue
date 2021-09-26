<template>
  <div ref="rootRef" class="group relative overflow-x-hiddenx">
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
      <span
        :class="categories[state.blockData.category]?.color"
        class="inline-block p-2 mr-2 rounded-lg bg-green-200"
      >
        <v-remixicon
          :path="icons[state.blockData.icon] || icons.riGlobalLine"
        />
      </span>
      <div style="max-width: 220px">
        <p class="font-semibold leading-none whitespace-nowrap">
          {{ state.blockData.name }}
        </p>
        <p class="text-gray-600 text-overflow leading-tight">
          {{ state.blockData.description }}
        </p>
      </div>
    </div>
    <div
      class="
        absolute
        top-0
        transition-transform
        duration-300
        group-hover:translate-y-16
        pt-4
        ml-1
        menu
      "
    >
      <div class="bg-accent px-4 py-2 text-white rounded-lg flex items-center">
        <button class="-ml-1">
          <v-remixicon size="20" :path="icons.riPencilLine" />
        </button>
        <hr class="border-r border-gray-600 h-5 mx-3" />
        <button
          class="-mr-1"
          @click="emitter.emit('block:delete', state.blockId)"
        >
          <v-remixicon size="20" :path="icons.riDeleteBin7Line" />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, nextTick, shallowReactive } from 'vue';
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import emitter from 'tiny-emitter/instance';
import { icons } from '@/lib/v-remixicon';
import { tasks, categories } from '@/utils/shared';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const rootRef = ref(null);
const state = shallowReactive({
  blockId: '',
  blockData: {},
});

nextTick(() => {
  state.blockId = rootRef.value?.parentElement.parentElement.id.replace(
    'node-',
    ''
  );

  if (state.blockId) {
    const { name } = props.editor.getNodeFromId(state.blockId);

    state.blockData = tasks[name];
  }
});
</script>
