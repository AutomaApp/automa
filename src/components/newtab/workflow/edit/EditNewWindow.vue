<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.type"
      class="mt-4 w-full"
      label="Type"
      @change="updateData({ type: $event })"
    >
      <option v-for="type in windowType" :key="type" :value="type">
        {{ type }}
      </option>
    </ui-select>
    <ui-input
      :model-value="data.url"
      class="mt-2 w-full"
      label="URL (optional)"
      placeholder="https://example.com"
      @change="updateData({ url: $event })"
    />
    <ui-select
      :model-value="data.windowState"
      class="mt-2 w-full"
      :label="t('workflow.blocks.new-window.windowState.placeholder')"
      @change="updateData({ windowState: $event })"
    >
      <option v-for="state in windowStates" :key="state" :value="state">
        {{ t(`workflow.blocks.new-window.windowState.options.${state}`) }}
      </option>
    </ui-select>
    <ui-checkbox
      :model-value="data.incognito"
      :disabled="!allowInIncognito"
      class="mt-1"
      @change="updateData({ incognito: $event })"
    >
      {{ t('workflow.blocks.new-window.incognito.text') }}
      <span :title="t('workflow.blocks.new-window.incognito.note')">
        &#128712;
      </span>
    </ui-checkbox>
    <div v-if="data.windowState === 'normal'" class="mt-2">
      <div
        :title="t('workflow.blocks.new-window.position')"
        class="mb-1 flex items-center space-x-2"
      >
        <ui-input
          :model-value="data.top"
          :label="t('workflow.blocks.new-window.top')"
          @change="updateData({ top: +$event })"
        />
        <ui-input
          :model-value="data.left"
          :label="t('workflow.blocks.new-window.left')"
          @change="updateData({ left: +$event })"
        />
      </div>
      <div
        :title="t('workflow.blocks.new-window.size')"
        class="flex items-center space-x-2"
      >
        <ui-input
          :model-value="data.height"
          :label="t('workflow.blocks.new-window.height')"
          @change="updateData({ height: +$event })"
        />
        <ui-input
          :model-value="data.width"
          :label="t('workflow.blocks.new-window.width')"
          @change="updateData({ width: +$event })"
        />
      </div>
      <p class="mt-2 text-gray-600 dark:text-gray-200">
        {{ t('workflow.blocks.new-window.note') }}
      </p>
    </div>
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

const windowType = ['normal', 'popup', 'panel'];
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
