<template>
  <component
    :is="tag"
    v-bind="$attrs"
    class="bg-white dark:bg-gray-800 transform rounded-lg ui-card"
    :class="[padding, { 'hover:shadow-xl hover:-translate-y-1': hover }]"
  >
    <slot></slot>
  </component>
</template>
<script>
export default {
  props: {
    hover: {
      type: Boolean,
      default: false,
    },
    padding: {
      type: String,
      default: 'p-4',
    },
    tag: {
      type: String,
      default: 'div',
    },
  },
};
</script>
