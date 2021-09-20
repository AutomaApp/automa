<template>
  <app-sidebar />
  <main class="pl-16 container mx-auto pr-2 py-6">
    <router-view />
  </main>
</template>
<script setup>
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';
</script>
