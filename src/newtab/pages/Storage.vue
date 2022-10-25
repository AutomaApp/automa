<template>
  <div class="container py-8 pb-4">
    <div class="flex items-center">
      <h1 class="text-2xl font-semibold">
        {{ t('common.storage') }}
      </h1>
      <a
        href="https://docs.automa.site/reference/storage.html"
        title="Docs"
        class="text-gray-600 dark:text-gray-200 ml-2"
        target="_blank"
      >
        <v-remixicon name="riInformationLine" size="20" />
      </a>
    </div>
    <ui-tabs v-model="state.activeTab" class="mt-5" @change="onTabChange">
      <ui-tab value="tables">
        {{ t('workflow.table.title', 2) }}
      </ui-tab>
      <ui-tab value="variables">
        {{ t('workflow.variables.title', 2) }}
      </ui-tab>
      <ui-tab value="credentials">
        {{ t('credential.title', 2) }}
      </ui-tab>
    </ui-tabs>
    <ui-tab-panels v-model="state.activeTab">
      <ui-tab-panel value="tables">
        <storage-tables />
      </ui-tab-panel>
      <ui-tab-panel value="variables">
        <storage-variables />
      </ui-tab-panel>
      <ui-tab-panel value="credentials">
        <storage-credentials />
      </ui-tab-panel>
    </ui-tab-panels>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import StorageTables from '@/components/newtab/storage/StorageTables.vue';
import StorageVariables from '@/components/newtab/storage/StorageVariables.vue';
import StorageCredentials from '@/components/newtab/storage/StorageCredentials.vue';

const tabs = ['tables', 'variables', 'credentials'];

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { tab } = route.query;

const state = reactive({
  activeTab: tabs.includes(tab) ? tab : 'tables',
});

function onTabChange(value) {
  router.replace({ query: { tab: value } });
}
</script>
