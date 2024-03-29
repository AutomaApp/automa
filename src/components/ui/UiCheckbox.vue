<template>
  <label
    class="checkbox-ui items-center"
    :class="[block ? 'flex' : 'inline-flex']"
  >
    <div
      :class="{
        'pointer-events-none opacity-75': disabled,
      }"
      class="relative inline-block h-5 w-5 rounded focus-within:ring-2 focus-within:ring-accent"
    >
      <input
        :class="{ indeterminate }"
        type="checkbox"
        class="checkbox-ui__input opacity-0"
        :value="modelValue"
        v-bind="{ checked: modelValue, disabled }"
        @change="changeHandler"
      />
      <div
        class="bg-input checkbox-ui__mark absolute top-0 left-0 cursor-pointer rounded border dark:border-gray-700"
      >
        <v-remixicon
          :name="indeterminate ? 'riSubtractLine' : 'riCheckLine'"
          size="20"
          class="text-white dark:text-black"
        ></v-remixicon>
      </div>
    </div>
    <span v-if="$slots.default" class="ml-2 inline-block">
      <slot></slot>
    </span>
  </label>
</template>
<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    indeterminate: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: null,
    },
    block: {
      type: Boolean,
      default: null,
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    function changeHandler({ target: { checked } }) {
      emit('update:modelValue', checked);
      emit('change', checked);
    }

    return {
      changeHandler,
    };
  },
};
</script>
<style scoped>
.checkbox-ui__input:checked ~ .checkbox-ui__mark .v-remixicon,
.checkbox-ui__input.indeterminate ~ .checkbox-ui__mark .v-remixicon {
  transform: scale(1) !important;
}
.checkbox-ui .v-remixicon {
  transform: scale(0);
}
.checkbox-ui__input:checked ~ .checkbox-ui__mark,
.checkbox-ui__input.indeterminate ~ .checkbox-ui__mark {
  @apply bg-accent border-accent bg-opacity-100;
}
.checkbox-ui__mark {
  width: 100%;
  height: 100%;
  transition-property: background-color, border-color;
  transition-timing-function: ease;
  transition-duration: 200ms;
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkbox-ui__mark .v-remixicon {
  transform: scale(0) !important;
  transition: transform 200ms ease;
}
</style>
