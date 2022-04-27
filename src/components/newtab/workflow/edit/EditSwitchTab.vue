<template>
  <div>
    <edit-autocomplete>
      <ui-input
        :model-value="data.matchPattern"
        placeholder="https://example.com/*"
        class="w-full"
        @change="updateData({ matchPattern: $event })"
      >
        <template #label>
          {{ t('workflow.blocks.switch-tab.matchPattern') }}
          <a
            :title="t('common.example', 2)"
            href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns#examples"
            target="_blank"
            rel="noopener"
            class="inline-block ml-1"
          >
            <v-remixicon
              name="riInformationLine"
              class="inline-block"
              size="18"
            />
          </a>
        </template>
      </ui-input>
    </edit-autocomplete>
    <ui-checkbox
      :model-value="data.createIfNoMatch"
      class="mt-1"
      @change="updateData({ createIfNoMatch: $event })"
    >
      {{ t('workflow.blocks.switch-tab.createIfNoMatch') }}
    </ui-checkbox>
    <edit-autocomplete v-if="data.createIfNoMatch" class="mt-2">
      <ui-input
        :model-value="data.url"
        :label="t('workflow.blocks.switch-tab.url')"
        placeholder="https://example.com"
        class="w-full"
        @change="updateData({ url: $event })"
      />
    </edit-autocomplete>
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

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
