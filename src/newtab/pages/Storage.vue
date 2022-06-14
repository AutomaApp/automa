<template>
  <div class="container py-8 pb-4">
    <h1 class="text-2xl font-semibold">
      {{ t('common.storage') }}
    </h1>
    <ui-tabs v-model="state.activeTab" class="mt-5">
      <ui-tab value="tables">
        {{ t('workflow.table.title', 2) }}
      </ui-tab>
    </ui-tabs>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const state = reactive({
  activeTab: 'tables',
});
</script>
