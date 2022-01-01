<template>
  <label class="checkbox-ui inline-flex items-center">
    <div
      :class="{ 'pointer-events-none opacity-75': disabled }"
      class="relative h-5 w-5 inline-block focus-within:ring-2 focus-within:ring-accent rounded"
    >
      <input
        type="checkbox"
        class="opacity-0 checkbox-ui__input"
        :value="modelValue"
        v-bind="{ checked: modelValue, disabled }"
        @change="changeHandler"
      />
      <div
        class="border rounded absolute top-0 left-0 bg-input checkbox-ui__mark cursor-pointer"
      >
        <v-remixicon
          name="riCheckLine"
          size="20"
          class="text-white"
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
    disabled: {
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
.checkbox-ui__input:checked ~ .checkbox-ui__mark .v-remixicon {
  transform: scale(1) !important;
}
.checkbox-ui .v-remixicon {
  transform: scale(0);
}
.checkbox-ui__input:checked ~ .checkbox-ui__mark {
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
