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
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';

const store = useStore();
const retrieved = ref(false);

store
  .dispatch('retrieve', ['workflows', 'logs'])
  .then(() => {
    retrieved.value = true;
  })
  .catch(() => {
    retrieved.value = true;
  });
</script>
