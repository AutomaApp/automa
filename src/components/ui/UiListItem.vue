<template>
  <component
    :is="tag"
    class="ui-list-item rounded-lg flex items-center transition w-full focus:outline-none"
    role="listitem"
    :class="[
      active ? color : 'hoverable',
      small ? 'p-2' : 'py-2 px-4',
      { 'pointer-events-none bg-opacity-75': disabled },
    ]"
  >
    <slot></slot>
  </component>
</template>
<script>
export default {
  props: {
    active: Boolean,
    disabled: Boolean,
    small: Boolean,
    tag: {
      type: String,
      default: 'div',
    },
    color: {
      type: String,
      default:
        'bg-primary text-primary dark:bg-secondary dark:text-secondary bg-opacity-10 dark:bg-opacity-10',
    },
  },
};
</script>
