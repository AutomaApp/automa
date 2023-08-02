<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="mb-2 w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.method || 'POST'"
      :label="t('workflow.blocks.webhook.method')"
      class="mb-2 w-full"
      @change="updateMethod"
    >
      <option v-for="method in methods" :key="method" :value="method">
        {{ method }}
      </option>
    </ui-select>
    <edit-autocomplete class="mb-2">
      <ui-textarea
        :model-value="data.url"
        :label="`${t('workflow.blocks.webhook.url')}*`"
        placeholder="http://api.example.com"
        class="w-full"
        rows="1"
        autocomplete="off"
        required
        type="url"
        @change="updateData({ url: $event })"
      />
    </edit-autocomplete>
    <ui-select
      :model-value="data.contentType"
      :label="t('workflow.blocks.webhook.contentType')"
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
      :label="
        t('workflow.blocks.webhook.timeout.placeholder') +
        ` (${t('common.0disable')})`
      "
      :title="t('workflow.blocks.webhook.timeout.title')"
      class="mb-2 w-full"
      type="number"
      @change="updateData({ timeout: +$event })"
    />
    <ui-tabs v-model="activeTab" fill>
      <ui-tab value="headers">
        {{ t('workflow.blocks.webhook.tabs.headers') }}
      </ui-tab>
      <ui-tab v-if="!notHaveBody.includes(data.method)" value="body">
        {{ t('workflow.blocks.webhook.tabs.body') }}
      </ui-tab>
      <ui-tab value="response">
        {{ t('workflow.blocks.webhook.tabs.response') }}
      </ui-tab>
    </ui-tabs>
    <ui-tab-panels v-model="activeTab">
      <ui-tab-panel
        value="headers"
        class="mt-4 grid grid-cols-7 justify-items-center gap-2"
      >
        <template v-for="(items, index) in headers" :key="index">
          <ui-input
            v-model="items.name"
            :title="items.name"
            :placeholder="`Header ${index + 1}`"
            type="text"
            class="col-span-3"
          />
          <ui-input
            v-model="items.value"
            :title="items.value"
            placeholder="Value"
            type="text"
            class="col-span-3"
          />
          <button @click="removeHeader(index)">
            <v-remixicon name="riCloseCircleLine" size="20" />
          </button>
        </template>
        <ui-button class="col-span-4 mt-4 block w-full" @click="addHeader">
          <span> {{ t('workflow.blocks.webhook.buttons.header') }} </span>
        </ui-button>
      </ui-tab-panel>
      <ui-tab-panel value="body" class="mt-4">
        <pre
          v-if="!showBodyModal"
          class="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-gray-200"
          @click="showBodyModal = true"
          v-text="data.body"
        />
      </ui-tab-panel>
      <ui-tab-panel value="response" class="mt-2">
        <ui-select
          :model-value="data.responseType"
          label="Response type"
          class="w-full"
          @change="updateData({ responseType: $event })"
        >
          <option value="json">JSON</option>
          <option value="text">Text</option>
          <option value="base64">Base64</option>
        </ui-select>
        <ui-input
          v-if="data.responseType === 'json'"
          :model-value="data.dataPath"
          placeholder="path.to.data"
          label="Data path"
          class="mt-2 w-full"
          @change="updateData({ dataPath: $event })"
        />
        <insert-workflow-data
          :data="data"
          :columns="[{ name: '[Assign columns]', id: '$assignColumns' }]"
          variables
          @update="updateData"
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
          href="https://docs.automa.site/workflow/expressions.html"
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
import InsertWorkflowData from './InsertWorkflowData.vue';
import EditAutocomplete from './EditAutocomplete.vue';

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

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const notHaveBody = ['GET'];
const copyHeaders = JSON.parse(JSON.stringify(props.data.headers));

const activeTab = ref('headers');
const showBodyModal = ref(false);
const headers = ref(Array.isArray(copyHeaders) ? copyHeaders : []);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function removeHeader(index) {
  headers.value.splice(index, 1);
}
function addHeader() {
  headers.value.push({ name: '', value: '' });
}
function updateMethod(method) {
  if (notHaveBody.includes(method) && activeTab.value === 'body') {
    activeTab.value = 'headers';
  }

  updateData({ method });
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
