<template>
  <component
    :is="tag"
    role="button"
    class="ui-button relative h-10 transition"
    :class="[
      color ? color : variants[btnType][variant],
      icon ? 'p-2' : 'py-2 px-4',
      circle ? 'rounded-full' : 'rounded-lg',
      {
        'opacity-70': disabled,
        'pointer-events-none': loading || disabled,
      },
    ]"
    v-bind="{ disabled: loading || disabled, ...$attrs }"
  >
    <span
      class="flex h-full items-center justify-center"
      :class="{ 'opacity-25': loading }"
    >
      <slot></slot>
    </span>
    <div v-if="loading" class="button-loading">
      <ui-spinner
        :color="
          variant === 'default'
            ? 'text-primary'
            : 'text-white dark:text-gray-900'
        "
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
    btnType: {
      type: String,
      default: 'fill',
    },
    variant: {
      type: String,
      default: 'default',
    },
  },
  setup() {
    const variants = {
      transparent: {
        default: 'hoverable',
      },
      fill: {
        default: 'bg-input',
        accent:
          'bg-accent hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-black text-white',
        primary:
          'bg-primary text-white dark:bg-secondary dark:hover:bg-primary hover:bg-secondary',
        danger:
          'bg-red-400 text-white dark:bg-red-500 dark:hover:bg-red-500 hover:bg-red-400',
      },
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
