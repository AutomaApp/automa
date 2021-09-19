<template>
  <div class="bg-accent rounded-b-2xl absolute top-0 left-0 h-32 w-full"></div>
  <div
    class="flex dark placeholder-black text-white px-5 pt-8 mb-6 items-center"
  >
    <ui-input
      autofocus
      prepend-icon="riSearch2Line"
      class="flex-1 search-input"
      placeholder="Search..."
    ></ui-input>
    <ui-button icon title="dashboard" class="ml-3" @click="openDashboard">
      <v-remixicon name="riHome5Line" />
    </ui-button>
  </div>
  <div class="px-5 pb-5 space-y-2">
    <home-workflow-card v-for="i in 10" :key="i" />
  </div>
</template>
<script setup>
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard.vue';

function openDashboard() {
  window.open(chrome.runtime.getURL('/newtab.html'), '_blank');
}
</script>
