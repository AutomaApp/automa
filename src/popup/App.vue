<template>
  <template v-if="retrieved">
    <router-view />
    <ui-dialog />
  </template>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import browser from 'webextension-polyfill';
import { useStore } from '@/stores/main';
import { useWorkflowStore } from '@/stores/workflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vueI18n';

const store = useStore();
const router = useRouter();
const workflowStore = useWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();

const retrieved = ref(false);

browser.storage.local.get('isRecording').then(({ isRecording }) => {
  if (isRecording) router.push('/recording');
});

onMounted(async () => {
  try {
    await store.loadSettings();
    await loadLocaleMessages(store.settings.locale, 'popup');
    await setI18nLanguage(store.settings.locale);

    await workflowStore.loadData();
    await hostedWorkflowStore.loadData();

    retrieved.value = true;
  } catch (error) {
    console.error(error);
    retrieved.value = true;
  }
});
</script>
<style>
body {
  height: 500px;
  width: 350px;
  font-size: 16px;
}
</style>
