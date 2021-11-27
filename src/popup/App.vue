<template>
  <template v-if="retrieved">
    <router-view />
    <ui-dialog />
  </template>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vue-i18n';

const store = useStore();
const retrieved = ref(false);

onMounted(async () => {
  try {
    await store.dispatch('retrieve');
    await loadLocaleMessages(store.state.locale, 'popup');
    await setI18nLanguage(store.state.locale);

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
  width: 330px;
  font-size: 16px;
}
</style>
