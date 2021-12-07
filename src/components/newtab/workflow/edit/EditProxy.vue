<template>
  <div>
    <div class="flex items-center mb-1">
      <ui-select
        :model-value="data.scheme"
        label="Scheme"
        class="mr-2"
        @change="updateData({ scheme: $event })"
      >
        <option v-for="scheme in schemes" :key="scheme" :value="scheme">
          {{ scheme.toUpperCase() }}
        </option>
      </ui-select>
      <ui-input
        :model-value="data.port"
        label="Port"
        placeholder="443"
        class="flex-1"
        type="number"
        @change="updateData({ port: +$event })"
      />
    </div>
    <ui-input
      :model-value="data.host"
      label="Host"
      placeholder="1.2.3.4"
      class="w-full mb-2"
      @change="updateData({ host: $event })"
    />
    <ui-input
      :model-value="data.bypassList"
      placeholder="example1.com, example2.org"
      class="w-full"
      @change="updateData({ bypassList: $event })"
    >
      <template #label>
        {{ t('workflow.blocks.proxy.bypass.label') }}
        <a
          href="https://developer.chrome.com/docs/extensions/reference/proxy/#bypass-list"
          target="_blank"
          rel="noopener"
        >
          &#128712;
        </a>
      </template>
    </ui-input>
    <p class="text-gray-600 dark:text-gray-200 text-sm">
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

const schemes = Object.values(chrome.proxy.Scheme);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
