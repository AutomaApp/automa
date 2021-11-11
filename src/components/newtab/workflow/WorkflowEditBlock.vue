<template>
  <div class="px-4 overflow-auto scroll pb-1">
    <div class="sticky top-0 z-20 bg-white border-b border-gray-100 pb-4 mb-4">
      <button class="mr-2 align-middle" @click="$emit('close')">
        <v-remixicon name="riArrowLeftLine" />
      </button>
      <p class="font-semibold inline-block align-middle">
        {{ data.name }}
      </p>
    </div>
    <component
      :is="data.editComponent"
      v-if="blockData"
      v-model:data="blockData"
      :block-id="data.blockId"
    />
  </div>
</template>
<script></script>
<script setup>
import { computed } from 'vue';

const editComponents = require.context(
  './edit',
  false,
  /^(?:.*\/)?Edit[^/]*\.vue$/
);
/* eslint-disable-next-line */
const components = editComponents.keys().reduce((acc, key) => {
  const name = key.replace(/(.\/)|\.vue$/g, '');
  const componentObj = editComponents(key)?.default ?? {};

  acc[name] = componentObj;

  return acc;
}, {});

export default {
  components,
};

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['close', 'update']);

const blockData = computed({
  get() {
    return props.data.data || {};
  },
  set(value) {
    emit('update', value);
  },
});
</script>
