<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.findTabBy"
      label="Find tab by"
      class="w-full mb-2 mt-3"
      @change="updateData({ findTabBy: $event })"
    >
      <option v-for="type in types" :key="type.id" :value="type.id">
        {{ type.name }}
      </option>
    </ui-select>
    <template v-if="data.findTabBy === 'match-patterns'">
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
    </template>
    <ui-input
      v-else-if="data.findTabBy === 'tab-index'"
      :model-value="data.tabIndex"
      label="Index"
      type="number"
      class="w-full"
      min="0"
      @change="updateData({ tabIndex: +$event })"
    />
    <ui-checkbox
      :model-value="data.activeTab"
      class="my-2"
      @change="updateData({ activeTab: $event })"
    >
      {{ t('workflow.blocks.new-tab.activeTab') }}
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
const types = [
  { id: 'match-patterns', name: 'Match patterns' },
  { id: 'next-tab', name: 'Next tab' },
  { id: 'prev-tab', name: 'Previous tab' },
  { id: 'tab-index', name: 'Tab index' },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
