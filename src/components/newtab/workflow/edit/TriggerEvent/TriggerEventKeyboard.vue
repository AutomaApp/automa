<template>
  <div class="grid grid-cols-2 gap-2">
    <ui-checkbox
      v-for="item in ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']"
      :key="item"
      v-model="defaultParams[item]"
    >
      {{ item }}
    </ui-checkbox>
  </div>
  <ui-input
    v-model="defaultParams.key"
    class="mt-2 w-full"
    label="key"
    placeholder="a"
    @change="findKeyDefintion"
  />
  <div class="mt-1 flex items-center space-x-2">
    <ui-input
      v-model="defaultParams.code"
      class="flex-1"
      label="code"
      placeholder="KeyA"
    />
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
import { keyDefinitions } from '@/utils/USKeyboardLayout';

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
  repeat: false,
});

function findKeyDefintion(value) {
  const keyDefinition = keyDefinitions[value];

  if (!keyDefinition) return;

  defaultParams.code = keyDefinitions[value].code;
  defaultParams.keyCode = keyDefinitions[value].keyCode;
}

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
