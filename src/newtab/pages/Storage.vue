<template>
  <div class="container py-8 pb-4">
    <h1 class="text-2xl font-semibold">
      {{ t('common.storage') }}
    </h1>
    <ui-tabs v-model="state.activeTab" class="mt-5">
      <ui-tab value="tables">
        {{ t('workflow.table.title', 2) }}
      </ui-tab>
      <ui-tab value="variables">
        {{ t('workflow.variables.title', 2) }}
      </ui-tab>
    </ui-tabs>
    <ui-tab-panels v-model="state.activeTab">
      <ui-tab-panel value="tables">
        <storage-tables />
      </ui-tab-panel>
      <ui-tab-panel value="variables">
        <storage-variables />
      </ui-tab-panel>
    </ui-tab-panels>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import StorageTables from '@/components/newtab/storage/StorageTables.vue';
import StorageVariables from '@/components/newtab/storage/StorageVariables.vue';

const { t } = useI18n();

const state = reactive({
  activeTab: 'tables',
});
</script>
