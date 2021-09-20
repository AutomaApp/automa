<template>
  <ui-card class="hover:ring-accent hover:ring-2">
    <div class="mb-6 flex items-center">
      <span class="p-2 rounded-full bg-accent inline-block text-white">
        <v-remixicon name="riGlobalLine" />
      </span>
      <div class="flex-grow"></div>
      <button class="mr-3">
        <v-remixicon name="riPlayLine" />
      </button>
      <button>
        <v-remixicon name="riMoreLine" />
      </button>
    </div>
    <router-link to="/workflow">
      <p class="line-clamp leading-tight font-semibold">Workflow name</p>
      <p class="text-gray-600 dark:text-gray-200 leading-tight text-overflow">
        3 Days ago
      </p>
    </router-link>
  </ui-card>
</template>
