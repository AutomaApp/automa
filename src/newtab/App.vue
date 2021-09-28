<template>
  <app-sidebar />
  <main class="pl-16">
    <router-view v-if="retrieved" />
  </main>
  <ui-dialog />
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import browser from 'webextension-polyfill';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';

const store = useStore();

const retrieved = ref(false);

onMounted(async () => {
  try {
    const data = await browser.storage.local.get(['workflows', 'tasks']);
    const promises = Object.keys(data).map((entity) =>
      store.dispatch('entities/create', {
        entity,
        data: data[entity],
      })
    );

    console.log(await Promise.allSettled(promises));

    retrieved.value = true;
  } catch (error) {
    retrieved.value = true;
    console.error(error);
  }
});
</script>
