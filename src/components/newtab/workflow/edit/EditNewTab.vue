<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      v-if="!data.activeTab"
      :model-value="data.url"
      :label="t('workflow.blocks.new-tab.url')"
      class="w-full mt-2"
      placeholder="http://example.com/"
      @change="updateData({ url: $event })"
    />
    <ui-checkbox
      :model-value="data.updatePrevTab"
      class="leading-tight mt-2"
      :title="t('workflow.blocks.new-tab.updatePrevTab.title')"
      @change="updateData({ updatePrevTab: $event })"
    >
      {{ t('workflow.blocks.new-tab.updatePrevTab.text') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.active"
      class="my-2"
      @change="updateData({ active: $event })"
    >
      {{ t('workflow.blocks.new-tab.activeTab') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.inGroup"
      @change="updateData({ inGroup: $event })"
    >
      {{ t('workflow.blocks.new-tab.tabToGroup') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.customUserAgent"
      block
      class="mt-2"
      @change="updateData({ customUserAgent: $event })"
    >
      {{ t('workflow.blocks.new-tab.customUserAgent') }}
    </ui-checkbox>
    <ui-input
      v-if="data.customUserAgent"
      :model-value="data.userAgent"
      placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      class="mt-1 w-full"
      @change="updateData({ userAgent: $event })"
    />
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
