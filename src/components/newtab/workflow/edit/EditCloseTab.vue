<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.closeType"
      :placeholder="Close"
      class="mt-2 w-full"
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
      <div class="mt-1">
        <ui-checkbox
          :model-value="data.activeTab"
          @change="updateData({ activeTab: $event })"
        >
          {{ t('workflow.blocks.close-tab.activeTab') }}
        </ui-checkbox>
      </div>
      <edit-autocomplete v-if="!data.activeTab">
        <ui-input
          :model-value="data.url"
          class="mt-1 w-full"
          placeholder="http://example.com/*"
          @change="updateData({ url: $event })"
        >
          <template #label>
            {{ t('workflow.blocks.close-tab.url') }}
            <a
              :title="t('common.example', 2)"
              rel="noopener"
              target="_blank"
              href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns#examples"
            >
              <v-remixicon
                name="riInformationLine"
                size="18"
                class="inline-block"
              />
            </a>
          </template>
        </ui-input>
      </edit-autocomplete>
    </template>
    <ui-checkbox
      v-else
      class="mt-1"
      :model-value="data.allWindows"
      @change="updateData({ allWindows: $event })"
    >
      {{ t('workflow.blocks.close-tab.allWindows') }}
    </ui-checkbox>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import EditAutocomplete from './EditAutocomplete.vue';

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
