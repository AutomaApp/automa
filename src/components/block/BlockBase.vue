<template>
  <div id="block-base" class="group relative">
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
        :class="block.category.color"
        class="inline-block p-2 mr-2 rounded-lg bg-green-200"
      >
        <v-remixicon :path="icons[block.details.icon] || icons.riGlobalLine" />
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
        <button class="-ml-1" @click="editBlock">
          <v-remixicon size="20" :path="icons.riPencilLine" />
        </button>
        <hr class="border-r border-gray-600 h-5 mx-3" />
        <button class="-mr-1" @click="editor.removeNodeId(`node-${block.id}`)">
          <v-remixicon size="20" :path="icons.riDeleteBin7Line" />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import emitter from 'tiny-emitter/instance';
import { icons } from '@/lib/v-remixicon';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const block = useEditorBlock('#block-base', props.editor);

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
