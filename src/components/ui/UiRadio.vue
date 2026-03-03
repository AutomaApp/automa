<template>
  <label class="radio-ui inline-flex items-center">
    <div
      class="relative inline-block h-5 w-5 rounded-full focus-within:ring-2 focus-within:ring-accent"
    >
      <input
        :id="inputId"
        type="radio"
        class="radio-ui__input opacity-0"
        :value="value"
        :aria-label="ariaLabel"
        v-bind="{ checked: isChecked }"
        @change="changeHandler"
      />
      <div
        class="bg-input radio-ui__mark absolute top-0 left-0 cursor-pointer rounded-full border"
      ></div>
    </div>
    <span v-if="$slots.default" class="ml-2 inline-block">
      <slot></slot>
    </span>
  </label>
</template>
<script>
import { computed } from 'vue';

export default {
  props: {
    inputId: {
      type: String,
      default: () => `radio-${Math.random().toString(36).substr(2, 9)}`,
    },
    ariaLabel: {
      type: String,
      default: '',
    },
    modelValue: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: undefined,
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const isChecked = computed(() => props.value === props.modelValue);

    function changeHandler({ target: { value } }) {
      emit('update:modelValue', value);
      emit('change', value);
    }

    return {
      isChecked,
      changeHandler,
    };
  },
};
</script>
<style scoped>
.radio-ui__input:checked ~ .radio-ui__mark {
  border-width: 6px;
  @apply border-accent;
}
.radio-ui__mark {
  width: 100%;
  height: 100%;
  transition-property: background-color, border-color;
  transition-timing-function: ease;
  transition-duration: 200ms;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
