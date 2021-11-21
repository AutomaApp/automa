<template>
  <app-sidebar />
  <main class="pl-16">
    <router-view v-if="retrieved" />
  </main>
  <ui-dialog />
</template>
<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import browser from 'webextension-polyfill';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';

const store = useStore();
const retrieved = ref(false);

store.dispatch('retrieveWorkflowState');
store
  .dispatch('retrieve', ['workflows', 'logs', 'collections'])
  .then(() => {
    retrieved.value = true;
  })
  .catch(() => {
    retrieved.value = true;
  });

function handleStorageChanged(change) {
  if (change.logs) {
    store.dispatch('entities/create', {
      entity: 'logs',
      data: change.logs.newValue,
    });
  }

  if (change.workflowState) {
    store.commit('updateState', {
      key: 'workflowState',
      value: change.workflowState.newValue,
    });
  }
}

browser.storage.local.onChanged.addListener(handleStorageChanged);

window.addEventListener('beforeunload', () => {
  browser.storage.local.onChanged.removeListener(handleStorageChanged);
});
</script>
