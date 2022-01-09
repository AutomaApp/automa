<template>
  <div class="mb-2 mt-4">
    <ui-select
      :model-value="data.closeType"
      placeholder="Close"
      class="w-full mb-4"
      @change="updateData({ closeType: $event })"
    >
      <option
        v-for="type in types"
        :key="type"
        :value="type"
        class="capitalize"
      >
        {{ type }}
      </option>
    </ui-select>
    <template v-if="data.closeType === 'tab'">
      <div class="mb-2">
        <ui-checkbox
          :model-value="data.activeTab"
          @change="updateData({ activeTab: $event })"
        >
          {{ t('workflow.blocks.close-tab.activeTab') }}
        </ui-checkbox>
      </div>
      <ui-input
        v-if="!data.activeTab"
        :model-value="data.url"
        placeholder="http://example.com/*"
        @change="updateData({ url: $event })"
      >
        <template #label>
          {{ t('workflow.blocks.close-tab.url') }}
          <a
            href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns"
            target="_blank"
            rel="noopener"
            title="More info"
          >
            &#9432;
          </a>
        </template>
      </ui-input>
    </template>
    <ui-checkbox
      v-else
      :model-value="data.allWindows"
      @change="updateData({ allWindows: $event })"
    >
      {{ t('workflow.blocks.close-tab.allWindows') }}
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
const types = ['tab', 'window'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
