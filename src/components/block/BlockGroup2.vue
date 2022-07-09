<template>
  <div
    :style="{
      width: `${data.width || 400}px`,
      height: `${data.height || 300}px`,
    }"
    class="group-block-2 group relative border-2 rounded-lg relative"
    style="
      min-width: 400px;
      min-height: 300px;
      border-color: #2563eb;
      background-color: rgb(37, 99, 235, 0.3);
    "
  >
    <div class="p-4 flex items-center">
      <input
        :value="data.name"
        placeholder="name"
        type="text"
        class="px-4 py-2 bg-white rounded-lg"
        @input="emit('update', { name: $event.target.value })"
      />
      <div class="flex-1" />
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer"
        @click="$emit('delete', id)"
      />
    </div>
    <span
      ref="dragHandle"
      style="cursor: nw-resize"
      class="drag-handle h-4 w-4 invisible group-hover:visible bg-accent absolute bottom-0 right-0"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  id: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  position: {
    type: Object,
    default: () => ({}),
  },
  events: {
    type: Object,
    default: () => ({}),
  },
  dimensions: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['delete', 'edit', 'update']);

let parent = null;
const initialRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

const dragHandle = ref(null);

function onMousemove(event) {
  event.preventDefault();
  event.stopPropagation();

  const width = initialRect.width + event.clientX - initialRect.x;
  const height = initialRect.height + event.clientY - initialRect.y;

  parent.style.width = `${width}px`;
  parent.style.height = `${height}px`;

  emit('update', { height, width });
}

function onMouseup() {
  document.documentElement.removeEventListener('mouseup', onMouseup);
  document.documentElement.removeEventListener('mousemove', onMousemove);
}
function initDragging(event) {
  event.preventDefault();
  event.stopPropagation();

  const { height, width } = getComputedStyle(parent);

  initialRect.x = event.clientX;
  initialRect.y = event.clientY;
  initialRect.width = parseInt(width, 10);
  initialRect.height = parseInt(height, 10);

  document.documentElement.addEventListener('mouseup', onMouseup);
  document.documentElement.addEventListener('mousemove', onMousemove);
}

onMounted(() => {
  parent = dragHandle.value.closest('.group-block-2');
  dragHandle.value.addEventListener('mousedown', initDragging);
});
onBeforeUnmount(() => {
  dragHandle.value.removeEventListener('mousedown', initDragging);
});
</script>
