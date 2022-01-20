<template>
  <div class="global-data">
    <a
      href="https://docs.automa.site/api-reference/reference-data.html"
      target="_blank"
      rel="noopener"
      class="inline-block text-primary"
    >
      {{ t('message.useDynamicData') }}
    </a>
    <p class="float-right clear-both" title="Characters limit">
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
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { debounce } from '@/utils/helper';
import SharedCodemirror from '@/components/newtab/shared/SharedCodemirror.vue';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

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
