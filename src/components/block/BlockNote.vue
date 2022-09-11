<template>
  <div
    :class="[data.color || 'white', colors[data.color || 'white']]"
    class="p-4 rounded-lg block-note"
    style="min-width: 192px"
  >
    <div class="pb-2 border-b flex items-center">
      <v-remixicon name="riFileEditLine" size="20" />
      <p class="flex-1 ml-2 mr-2 font-semibold">Note</p>
      <ui-popover class="note-color">
        <template #trigger>
          <v-remixicon
            name="riSettings3Line"
            size="20"
            class="cursor-pointer"
          />
        </template>
        <p class="mb-1 ml-1 text-sm text-gray-600 dark:text-gray-200">Colors</p>
        <div class="flex items-center space-x-2">
          <span
            v-for="(color, colorId) in colors"
            :key="colorId"
            :class="color"
            style="border-width: 3px"
            class="h-8 w-8 rounded-full inline-block cursor-pointer"
            @click="updateData({ color: colorId })"
          />
        </div>
        <ui-select
          :model-value="data.fontSize"
          label="Font size"
          class="mt-2 w-full"
          @change="updateData({ fontSize: $event })"
        >
          <option
            v-for="(size, fontId) in fontSize"
            :key="fontId"
            :value="fontId"
          >
            {{ size.name }}
          </option>
        </ui-select>
      </ui-popover>
      <hr class="mx-2 h-7 border-r" />
      <v-remixicon
        name="riDeleteBin7Line"
        size="20"
        class="cursor-pointer"
        @click="$emit('delete', id)"
      />
    </div>
    <textarea
      :value="data.note"
      :style="initialSize"
      :class="[fontSize[data.fontSize || 'regular'].class]"
      placeholder="Write a note here..."
      cols="30"
      rows="7"
      style="resize: both; min-width: 280px; min-height: 168px"
      class="focus:ring-0 mt-2 bg-transparent"
      @input="updateData({ note: $event.target.value })"
      @mousedown.stop
      @mouseup="onMouseup"
    />
  </div>
</template>
<script setup>
import { debounce } from '@/utils/helper';

const props = defineProps({
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
});
const emit = defineEmits(['update', 'delete']);

const initialSize = {
  width: `${props.data.width}px`,
  height: `${props.data.height}px`,
};

const colors = {
  white: 'bg-white dark:bg-gray-800',
  red: 'bg-red-200 dark:bg-red-300',
  indigo: 'bg-indigo-200 dark:bg-indigo-300',
  green: 'bg-green-200 dark:bg-green-300',
  amber: 'bg-amber-200 dark:bg-amber-300',
  sky: 'bg-sky-200 dark:bg-sky-300',
};
const fontSize = {
  regular: {
    name: 'Regular',
    class: 'text-base',
  },
  medium: {
    name: 'Medium',
    class: 'text-xl',
  },
  large: {
    name: 'Large',
    class: 'text-2xl',
  },
  'extra-large': {
    name: 'Extra Large',
    class: 'text-3xl',
  },
};

const updateData = debounce((data) => {
  emit('update', data);
}, 250);

function onMouseup({ target }) {
  let { height, width } = target.style;
  width = parseInt(width, 10);
  height = parseInt(height, 10);

  if (width === props.data.width && height === props.data.height) return;

  updateData({ height, width });
}
</script>
<style>
.note-color .ui-popover__trigger {
  @apply flex items-center;
}
.block-note * {
  border-color: rgb(0 0 0 / 12%);
}
.dark .block-note {
  &:not(.white) {
    @apply text-gray-900;
  }
  &.white * {
    border-color: rgb(255 255 255 / 12%);
  }
  * {
    border-color: rgb(0 0 0 / 12%);
  }
}
</style>
