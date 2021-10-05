<template>
  <div class="grid gap-2 grid-cols-2">
    <ui-checkbox
      v-for="item in ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']"
      :key="item"
      v-model="defaultParams[item]"
    >
      {{ item }}
    </ui-checkbox>
  </div>
  <ui-select
    v-model.number="defaultParams.button"
    class="mt-2 w-full"
    label="Button"
  >
    <option v-for="button in buttons" :key="button.id" :value="button.id">
      {{ button.name }}
    </option>
  </ui-select>
  <div
    v-for="items in posGroups"
    :key="items[0]"
    class="flex items-center space-x-2 mt-2"
  >
    <ui-input
      v-model.number="defaultParams[items[0]]"
      type="number"
      class="flex-1"
      :label="items[0]"
    />
    <ui-input
      v-model.number="defaultParams[items[1]]"
      type="number"
      class="flex-1"
      :label="items[1]"
    />
  </div>
</template>
<script setup>
import { shallowReactive, watch, onMounted } from 'vue';
import { objectHasKey } from '@/utils/helper';

const props = defineProps({
  params: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const buttons = [
  { id: 0, name: 'Left click' },
  { id: 1, name: 'Middle click' },
  { id: 2, name: 'Right click' },
];
const posGroups = [
  ['clientX', 'clientY'],
  ['movementX', 'movementY'],
  ['offsetX', 'offsetY'],
  ['pageX', 'pageY'],
  ['screenX', 'screenY'],
];

const defaultParams = shallowReactive({
  altKey: false,
  button: 0,
  clientX: 0,
  clientY: 0,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  movementX: 0,
  movementY: 0,
  offsetX: 0,
  offsetY: 0,
  pageX: 0,
  pageY: 0,
  screenX: 0,
  screenY: 0,
});

watch(
  defaultParams,
  (value) => {
    emit('update', value);
  },
  { deep: true }
);

onMounted(() => {
  Object.entries(props.params).forEach(([key, value]) => {
    if (objectHasKey(defaultParams, key)) defaultParams[key] = value;
  });
});
</script>
