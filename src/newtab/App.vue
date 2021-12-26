<template>
  <template v-if="retrieved">
    <app-sidebar />
    <main class="pl-16">
      <router-view />
    </main>
    <ui-dialog />
  </template>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import browser from 'webextension-polyfill';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vue-i18n';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';
import { sendMessage } from '@/utils/message';

const store = useStore();
const retrieved = ref(false);

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

onMounted(async () => {
  try {
    await store.dispatch('retrieve', ['workflows', 'logs', 'collections']);
    await store.dispatch('retrieveWorkflowState');

    await loadLocaleMessages(store.state.settings.locale, 'newtab');
    await setI18nLanguage(store.state.settings.locale);

    await sendMessage('workflow:check-state', {}, 'background');

    retrieved.value = true;
  } catch (error) {
    retrieved.value = true;
    console.error(error);
  }
});
</script>
