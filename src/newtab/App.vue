<template>
  <app-sidebar />
  <main class="pl-20">
    <router-view />
  </main>
</template>
<script setup>
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';
</script>
