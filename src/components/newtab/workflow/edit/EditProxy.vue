<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="mb-2 w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.host"
      placeholder="socks5://1.2.3.4:1080"
      class="mb-2 w-full"
      @change="updateData({ host: $event })"
    >
      <template #label>
        <span class="input-label">
          {{ t('workflow.blocks.proxy.hostLabel') }}
        </span>
        <v-remixicon
          :title="t('workflow.blocks.proxy.supportedProtocols')"
          name="riInformationLine"
          class="inline-block"
          size="18"
        />
      </template>
    </ui-input>
    <ui-input
      :model-value="data.port"
      :label="t('workflow.blocks.proxy.portLabel')"
      placeholder="443"
      class="mb-2 w-full"
      @change="updateData({ port: $event })"
    />
    <label for="input-bypass" class="input-label">
      {{ t('workflow.blocks.proxy.bypass.label') }}
      <a
        href="https://developer.chrome.com/docs/extensions/reference/proxy/#bypass-list"
        target="_blank"
        rel="noopener"
      >
        &#128712;
      </a>
    </label>
    <ui-textarea
      id="input-bypass"
      :model-value="data.bypassList"
      placeholder="example1.com, example2.org"
      class="w-full"
      @change="updateData({ bypassList: $event })"
    >
    </ui-textarea>
    <p class="text-sm text-gray-600 dark:text-gray-200">
      {{ t('workflow.blocks.proxy.bypass.note') }}
    </p>
    <ui-checkbox
      :model-value="data.clearProxy"
      class="mt-4"
      @change="updateData({ clearProxy: $event })"
    >
      {{ t('workflow.blocks.proxy.clear') }}
    </ui-checkbox>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
