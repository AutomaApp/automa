<template>
  <ui-list class="space-y-1">
    <ui-list-item
      v-for="task in tasks"
      :key="task.name"
      :active="task.status === 'running'"
      class="relative group"
      color="bg-box-transparent"
    >
      <ui-spinner
        v-if="task.status === 'running'"
        color="text-accent dark:text-gray-200"
        size="20"
      ></ui-spinner>
      <v-remixicon
        v-else-if="task.status === 'success'"
        name="riCheckboxCircleLine"
        class="-ml-0.5"
      />
      <p class="ml-3 flex-1">{{ task.name }}</p>
    </ui-list-item>
  </ui-list>
</template>
<script>
export default {
  props: {
    tasks: {
      type: Array,
      default: () => [],
    },
  },
};
</script>
