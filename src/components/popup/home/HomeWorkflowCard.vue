<template>
  <ui-card
    class="w-full flex items-center space-x-2 hover:ring-2 hover:ring-gray-900"
  >
    <div class="flex-1">
      <p class="leading-tight">halo {{ 1 }}</p>
      <p class="leading-none text-gray-500">3 days ago</p>
    </div>
    <router-link to="/workflow/anu" icon title="Execute">
      <v-remixicon name="riPlayLine" />
    </router-link>
    <ui-popover class="h-6">
      <template #trigger>
        <button>
          <v-remixicon name="riMoreLine" />
        </button>
      </template>
    </ui-popover>
  </ui-card>
</template>
