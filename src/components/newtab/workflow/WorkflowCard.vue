<template>
  <ui-card class="hover:ring-accent hover:ring-2">
    <div class="mb-4 flex items-center">
      <span class="p-2 rounded-lg bg-box-transparent inline-block">
        <v-remixicon name="riGlobalLine" />
      </span>
      <div class="flex-grow"></div>
      <button>
        <v-remixicon name="riPlayLine" />
      </button>
      <button v-if="showDetails" class="ml-3">
        <v-remixicon name="riMoreLine" />
      </button>
    </div>
    <router-link to="/workflows/anId">
      <p class="line-clamp leading-tight font-semibold">Workflow name</p>
      <p class="text-gray-600 dark:text-gray-200 leading-tight text-overflow">
        3 Days ago
      </p>
    </router-link>
  </ui-card>
</template>
<script setup>
/* eslint-disable-next-line */
defineProps({
  showDetails: {
    type: Boolean,
    default: true,
  },
});
</script>
