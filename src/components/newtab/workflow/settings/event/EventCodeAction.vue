<template>
  <shared-codemirror
    :model-value="data.code"
    class="h-full w-full"
    @change="$emit('update:data', { code: $event })"
  />
</template>
<script setup>
import { defineAsyncComponent } from 'vue';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['update:data']);
</script>
