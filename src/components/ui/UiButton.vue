<template>
  <component
    :is="tag"
    role="button"
    class="ui-button h-10 relative transition"
    :class="[
      color ? color : variants[variant],
      icon ? 'p-2' : 'py-2 px-4',
      circle ? 'rounded-full' : 'rounded-lg',
      { 'opacity-70': disabled, 'pointer-events-none': loading || disabled },
    ]"
    v-bind="{ disabled: loading || disabled, ...$attrs }"
  >
    <span
      class="flex justify-center h-full items-center"
      :class="{ 'opacity-25': loading }"
    >
      <slot></slot>
    </span>
    <div v-if="loading" class="button-loading">
      <ui-spinner
        :color="variant === 'default' ? 'text-primary' : 'text-white'"
      ></ui-spinner>
    </div>
  </component>
</template>
<script>
import UiSpinner from './UiSpinner.vue';

export default {
  components: { UiSpinner },
  props: {
    icon: Boolean,
    disabled: Boolean,
    loading: Boolean,
    circle: Boolean,
    color: {
      type: String,
      default: '',
    },
    tag: {
      type: String,
      default: 'button',
    },
    variant: {
      type: String,
      default: 'default',
    },
  },
  setup() {
    const variants = {
      default: 'bg-input',
      accent:
        'bg-accent hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 text-white',
      primary:
        'bg-primary text-white dark:bg-secondary dark:hover:bg-primary hover:bg-secondary',
      danger:
        'bg-red-500 text-white dark:bg-red-600 dark:hover:bg-red-500 hover:bg-red-600',
    };

    return {
      variants,
    };
  },
};
</script>
<style>
.button-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
