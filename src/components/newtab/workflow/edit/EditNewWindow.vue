<template>
  <div class="mb-2 mt-4 space-y-2">
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.windowState"
      class="w-full"
      :placeholder="t('workflow.blocks.new-window.windowState.placeholder')"
      @change="updateData({ windowState: $event })"
    >
      <option v-for="state in windowStates" :key="state" :value="state">
        {{ t(`workflow.blocks.new-window.windowState.options.${state}`) }}
      </option>
    </ui-select>
    <ui-checkbox
      :model-value="data.incognito"
      :disabled="!allowInIncognito"
      @change="updateData({ incognito: $event })"
    >
      {{ t('workflow.blocks.new-window.incognito.text') }}
      <span :title="t('workflow.blocks.new-window.incognito.note')">
        &#128712;
      </span>
    </ui-checkbox>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const windowStates = ['normal', 'minimized', 'maximized', 'fullscreen'];
const allowInIncognito = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

onMounted(async () => {
  allowInIncognito.value = await browser.extension.isAllowedIncognitoAccess();

  if (!allowInIncognito.value) {
    updateData({ incognito: false });
  }
});
</script>
