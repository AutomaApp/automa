<template>
  <div>
    <template v-if="hasPermission">
      <ui-textarea
        :model-value="data.description"
        class="w-full"
        :placeholder="t('common.description')"
        @change="updateData({ description: $event })"
      />
      <ui-input
        :model-value="data.timeout"
        :label="t('workflow.blocks.handle-download.timeout')"
        placeholder="1000"
        type="number"
        class="w-full mt-2"
        @change="updateData({ timeout: +$event || 1000 })"
      />
      <ui-input
        :model-value="data.filename"
        :label="`${t('common.fileName')} (${t('common.optional')})`"
        placeholder="file"
        class="mt-2 w-full"
        @change="updateData({ filename: $event })"
      />
      <ui-select
        :model-value="data.onConflict"
        :label="t('workflow.blocks.handle-download.onConflict')"
        class="mt-2 w-full"
        @change="updateData({ onConflict: $event })"
      >
        <option v-for="item in onConflict" :key="item" :value="item">
          {{ t(`workflow.blocks.base.downloads.onConflict.${item}`) }}
        </option>
      </ui-select>
      <ui-checkbox
        :model-value="data.waitForDownload"
        class="mt-4"
        @change="updateData({ waitForDownload: $event })"
      >
        {{ t('workflow.blocks.handle-download.waitFile') }}
      </ui-checkbox>
      <insert-workflow-data
        v-if="data.waitForDownload"
        :data="data"
        variables
        @update="updateData"
      />
    </template>
    <template v-else>
      <p class="mt-4">
        {{ t('workflow.blocks.handle-download.noPermission') }}
      </p>
      <ui-button variant="accent" class="mt-2" @click="requestPermission">
        {{ t('workflow.blocks.clipboard.grantPermission') }}
      </ui-button>
    </template>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const permission = { permissions: ['downloads'] };
const onConflict = ['uniquify', 'overwrite', 'prompt'];

const { t } = useI18n();

const hasPermission = ref(false);

function handlePermission(status) {
  hasPermission.value = status;
}
function requestPermission() {
  browser.permissions.request(permission).then((isGranted) => {
    if (isGranted) chrome.runtime.reload();
  });
}
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

onMounted(() => {
  browser.permissions.contains(permission).then(handlePermission);
});
</script>
