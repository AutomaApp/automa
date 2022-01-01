<template>
  <label class="radio-ui inline-flex items-center">
    <div
      class="relative h-5 w-5 inline-block focus-within:ring-2 focus-within:ring-accent rounded-full"
    >
      <input
        type="radio"
        class="opacity-0 radio-ui__input"
        :value="value"
        v-bind="{ checked: isChecked }"
        @change="changeHandler"
      />
      <div
        class="border rounded-full absolute top-0 left-0 bg-input radio-ui__mark cursor-pointer"
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
