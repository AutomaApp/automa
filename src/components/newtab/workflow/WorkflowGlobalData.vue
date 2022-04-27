<template>
  <div class="global-data">
    <p class="text-right" title="Characters limit">
      {{ globalData.length }}/{{ maxLength.toLocaleString() }}
    </p>
    <shared-codemirror
      v-model="globalData"
      style="height: calc(100vh - 10rem)"
      lang="json"
    />
  </div>
</template>
<script setup>
import { ref, watch, defineAsyncComponent } from 'vue';
import { debounce } from '@/utils/helper';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const maxLength = 1e4;
const globalData = ref(`${props.workflow.globalData}`);

watch(
  globalData,
  debounce((value) => {
    let newValue = value;

    if (value.length > maxLength) {
      newValue = value.slice(0, maxLength);
      globalData.value = newValue;
    }

    emit('update', { globalData: newValue });
  }, 250)
);
</script>
