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
  <ui-input v-model="defaultParams.code" class="w-full mt-2" label="code" />
  <div class="flex items-center mt-1 space-x-2">
    <ui-input v-model="defaultParams.key" class="flex-1" label="key" />
    <ui-input
      v-model.number="defaultParams.keyCode"
      type="number"
      class="flex-1"
      label="keyCode"
    />
  </div>
  <ui-checkbox v-model="defaultParams.repeat" class="mt-4">
    Repeat
  </ui-checkbox>
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
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  code: '',
  key: '',
  keyCode: 0,
  repat: false,
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
