<template>
  <div class="grid gap-2 grid-cols-2">
    <ui-input
      v-model.number="defaultParams.deltaX"
      type="number"
      label="deltaX"
    />
    <ui-input
      v-model.number="defaultParams.deltaY"
      type="number"
      label="deltaY"
    />
    <ui-input
      v-model.number="defaultParams.deltaZ"
      type="number"
      class="col-span-2"
      label="deltaZ"
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

const defaultParams = shallowReactive({
  deltaX: 0,
  deltaY: 0,
  deltaZ: 0,
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
