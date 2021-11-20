<template>
  <div class="global-data">
    <a
      href="https://github.com/Kholid060/automa/wiki/Features#reference-data"
      target="_blank"
      rel="noopener"
      class="inline-block text-primary"
    >
      Learn how to access the global data in a block
    </a>
    <p class="float-right clear-both" title="Characters limit">
      {{ globalData.length }}/{{ maxLength.toLocaleString() }}
    </p>
    <prism-editor
      v-model="globalData"
      :highlight="highlighter('json')"
      class="h-full scroll mt-2"
      style="height: calc(100vh - 10rem)"
    />
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import { highlighter } from '@/lib/prism';
import { debounce } from '@/utils/helper';

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
