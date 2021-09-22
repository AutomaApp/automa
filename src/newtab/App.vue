<template>
  <app-sidebar />
  <main class="pl-16 container mx-auto pr-2 py-6">
    <router-view />
  </main>
  <ui-dialog />
</template>
<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import browser from 'webextension-polyfill';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';

const store = useStore();

onMounted(async () => {
  console.log(browser, 'browser');
  try {
    const data = await browser.storage.local.get(['workflows', 'tasks']);

    Object.keys(data).forEach((entity) => {
      store.dispatch('entities/create', {
        entity,
        data: data[entity],
      });
    });
  } catch (error) {
    console.error(error);
  }
});
</script>
