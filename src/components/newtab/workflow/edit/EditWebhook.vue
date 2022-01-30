<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.url"
      class="mb-2 w-full"
      placeholder="https://example.com/postreceive"
      required
      :title="t('workflow.blocks.webhook.url')"
      type="url"
      @change="updateData({ url: $event })"
    />
    <ui-select
      :model-value="data.contentType"
      :placeholder="t('workflow.blocks.webhook.contentType')"
      class="mb-2 w-full"
      @change="updateData({ contentType: $event })"
    >
      <option
        v-for="type in contentTypes"
        :key="type.value"
        :value="type.value"
      >
        {{ type.name }}
      </option>
    </ui-select>
    <ui-input
      :model-value="data.timeout"
      :placeholder="t('workflow.blocks.webhook.timeout.placeholder')"
      :title="t('workflow.blocks.webhook.timeout.title')"
      class="mb-2 w-full"
      type="number"
      @change="updateData({ timeout: +$event })"
    />
    <ui-tabs v-model="activeTab" fill class="mb-4">
      <ui-tab value="headers">
        {{ t('workflow.blocks.webhook.tabs.headers') }}
      </ui-tab>
      <ui-tab value="body">{{ t('workflow.blocks.webhook.tabs.body') }}</ui-tab>
    </ui-tabs>
    <ui-tab-panels :model-value="activeTab">
      <ui-tab-panel
        value="headers"
        class="grid grid-cols-7 justify-items-center gap-2"
      >
        <template v-for="(items, index) in headers" :key="index">
          <ui-input
            v-model="items.name"
            :placeholder="`Header ${index + 1}`"
            type="text"
            class="col-span-3"
          />
          <ui-input
            v-model="items.value"
            placeholder="Value"
            type="text"
            class="col-span-3"
          />
          <button @click="removeHeader(index)">
            <v-remixicon name="riCloseCircleLine" size="20" />
          </button>
        </template>
        <ui-button
          class="col-span-4 mt-4 block w-full"
          variant="accent"
          @click="addHeader"
        >
          <span> {{ t('workflow.blocks.webhook.buttons.header') }} </span>
        </ui-button>
      </ui-tab-panel>
      <ui-tab-panel value="body">
        <pre
          v-if="!showBodyModal"
          class="rounded-lg text-gray-200 p-4 max-h-80 bg-gray-900 overflow-auto"
          @click="showBodyModal = true"
          v-text="data.body"
        />
      </ui-tab-panel>
    </ui-tab-panels>
    <ui-modal
      v-model="showBodyModal"
      content-class="max-w-3xl"
      :title="t('workflow.blocks.webhook.tabs.body')"
    >
      <shared-codemirror
        :model-value="data.body"
        lang="json"
        style="height: calc(100vh - 10rem)"
        @change="updateData({ body: $event })"
      />
      <div class="mt-3">
        <a
          href="https://docs.automa.site/api-reference/reference-data.html"
          rel="noopener"
          class="border-b text-primary"
          target="_blank"
        >
          {{ t('message.useDynamicData') }}
        </a>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { ref, watch, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { contentTypes } from '@/utils/shared';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const activeTab = ref('headers');
const showBodyModal = ref(false);
const headers = ref(JSON.parse(JSON.stringify(props.data.headers)));

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function removeHeader(index) {
  headers.value.splice(index, 1);
}
function addHeader() {
  headers.value.push({ name: '', value: '' });
}

watch(
  headers,
  (value) => {
    updateData({ headers: value });
  },
  { deep: true }
);
</script>
<style scoped>
code {
  @apply bg-gray-900 text-sm text-white p-1 rounded-md;
}
</style>
