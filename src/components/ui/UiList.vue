<template>
  <div
    role="listbox"
    class="ui-list"
    :class="{ 'pointer-events-none': disabled }"
  >
    <slot></slot>
  </div>
</template>
<script>
export default {
  props: {
    disabled: Boolean,
  },
};
</script>
