<template>
  <div
    class="ui-switch bg-input relative inline-flex h-6 w-12 items-center justify-center rounded-full p-1"
    :class="{ 'pointer-events-none opacity-50': disabled }"
  >
    <input
      :checked="modelValue"
      type="checkbox"
      class="absolute left-0 top-0 z-50 h-full w-full cursor-pointer opacity-0"
      v-bind="{ disabled, readonly: disabled || null }"
      @input="emitEvent"
    />
    <div
      class="ui-switch__ball absolute z-40 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xl"
    >
      <slot v-if="$slots.ball" name="ball"></slot>
    </div>
    <div
      class="ui-switch__background absolute left-0 top-0 h-full w-full rounded-md bg-accent"
    ></div>
  </div>
</template>
<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    return {
      emitEvent: () => {
        const newValue = !props.modelValue;

        emit('change', newValue);
        emit('update:modelValue', newValue);
      },
    };
  },
};
</script>
<style scoped>
.ui-switch {
  overflow: hidden;
  transition: all 250ms ease;
}

.ui-switch:active {
  transform: scale(0.93);
}

.ui-switch__ball {
  transition: all 250ms ease;
  left: 6px;
}

.ui-switch__background {
  transition: all 250ms ease;
  margin-left: -100%;
}

.ui-switch:hover .ui-switch__ball {
  transform: scale(1.1);
}

.ui-switch input:focus ~ .ui-switch__ball {
  transform: scale(1.1);
}

.ui-switch input:checked ~ .ui-switch__ball {
  @apply dark:bg-gray-900;
  background-color: white;
  left: calc(100% - 21px);
}

.ui-switch input:checked ~ .ui-switch__background {
  margin-left: 0;
}
</style>
