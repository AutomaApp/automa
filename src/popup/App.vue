<template>
  <template v-if="retrieved">
    <router-view />
    <ui-dialog />
  </template>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import browser from 'webextension-polyfill';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vueI18n';

const store = useStore();
const router = useRouter();

const retrieved = ref(false);

browser.storage.local.get('isRecording').then(({ isRecording }) => {
  if (isRecording) router.push('/recording');
});

onMounted(async () => {
  try {
    await store.dispatch('retrieve');
    await loadLocaleMessages(store.state.settings.locale, 'popup');
    await setI18nLanguage(store.state.settings.locale);

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
