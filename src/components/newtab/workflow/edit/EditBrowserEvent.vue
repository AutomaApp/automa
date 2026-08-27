<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.timeout"
      :label="t('workflow.blocks.browser-event.timeout')"
      type="number"
      class="w-full"
      @change="updateData({ timeout: +$event })"
    />
    <ui-select
      :placeholder="t('workflow.blocks.browser-event.events')"
      :model-value="data.eventName"
      class="mt-2 w-full"
      @change="updateData({ eventName: $event })"
    >
      <optgroup
        v-for="(events, label) in browserEvents"
        :key="label"
        :label="t(`workflow.blocks.browser-event.groups.${label}`)"
      >
        <option v-for="event in events" :key="event.id" :value="event.id">
          {{ t(`workflow.blocks.browser-event.eventNames.${event.id}`) }}
        </option>
      </optgroup>
    </ui-select>
    <template v-if="data.eventName === 'tab:loaded'">
      <ui-input
        v-if="!data.activeTabLoaded"
        :model-value="data.tabLoadedUrl"
        type="url"
        class="mt-1 w-full"
        placeholder="https://example.org/*"
        @change="updateData({ tabLoadedUrl: $event })"
      >
        <template #label>
          <span>{{ t('workflow.blocks.browser-event.matchPattern') }}</span>
          <a
            href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns#examples"
            target="_blank"
            rel="noopener"
            :title="t('common.example', 2)"
          >
            <v-remixicon
              class="ml-1 inline-block"
              name="riInformationLine"
              size="18"
            />
          </a>
        </template>
      </ui-input>
      <ui-checkbox
        :model-value="data.activeTabLoaded"
        class="mt-1"
        @change="updateData({ activeTabLoaded: $event })"
      >
        {{ t('workflow.blocks.browser-event.activeTabLoaded') }}
      </ui-checkbox>
    </template>
    <template v-if="['tab:create', 'window:create'].includes(data.eventName)">
      <ui-input
        :model-value="data.tabUrl"
        type="url"
        :label="t('workflow.blocks.browser-event.filter')"
        class="mt-1 w-full"
        :placeholder="t('workflow.blocks.browser-event.urlOrRegex')"
        @change="updateData({ tabUrl: $event })"
      />
      <ui-checkbox
        :model-value="data.setAsActiveTab"
        class="mt-1"
        @change="updateData({ setAsActiveTab: $event })"
      >
        {{ t('workflow.blocks.browser-event.setAsActiveTab') }}
      </ui-checkbox>
    </template>
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

const browserEvents = {
  Tab: [{ id: 'tab:close' }, { id: 'tab:loaded' }, { id: 'tab:create' }],
  Window: [{ id: 'window:create' }, { id: 'window:close' }],
};

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
