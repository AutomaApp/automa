<template>
  <div class="inline-block input-ui">
    <label
      v-if="label || $slots.label"
      :for="componentId"
      class="text-sm dark:text-gray-200 text-gray-600 ml-1 inline-block leading-none"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <div class="flex items-center relative w-full">
      <slot name="prepend">
        <v-remixicon
          v-if="prependIcon"
          class="ml-2 dark:text-gray-200 text-gray-600 absolute left-0"
          :name="prependIcon"
        ></v-remixicon>
      </slot>
      <input
        v-bind="{
          readonly: disabled || readonly || null,
          placeholder,
          type,
          autocomplete,
          autofocus,
          min,
          max,
          list,
          step,
        }"
        :id="componentId"
        v-autofocus="autofocus"
        v-imask="mask"
        :class="[
          inputClass,
          {
            'opacity-75 pointer-events-none': disabled,
            'pl-10': prependIcon || $slots.prepend,
            'appearance-none': list,
          },
        ]"
        :value="modelValue"
        class="py-2 px-4 rounded-lg w-full bg-input bg-transparent transition"
        @keydown="$emit('keydown', $event)"
        @keyup="$emit('keyup', $event)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @input="emitValue"
      />
      <slot name="append" />
    </div>
  </div>
</template>
<script setup>
/* eslint-disable vue/require-prop-types */
import { IMaskDirective as vImask } from 'vue-imask';
import { useComponentId } from '@/composable/componentId';

const props = defineProps({
  modelModifiers: {
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Number, Object],
    default: '',
  },
  inputClass: {
    type: String,
    default: '',
  },
  prependIcon: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  list: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  max: {
    type: [String, Number],
    default: null,
  },
  min: {
    type: [String, Number],
    default: null,
  },
  autocomplete: {
    type: String,
    default: null,
  },
  step: {
    type: String,
    default: null,
  },
  mask: {
    type: [Array, Object],
    default: null,
  },
  unmaskValue: Boolean,
});
const emit = defineEmits([
  'update:modelValue',
  'change',
  'keydown',
  'blur',
  'keyup',
  'focus',
]);

const componentId = useComponentId('ui-input');

function emitValue(event) {
  let { value } = event.target;

  if (props.mask && props.unmaskValue) {
    const { maskRef } = event.target;
    if (maskRef && maskRef.unmaskedValue) value = maskRef.unmaskedValue;
  }

  if (props.modelModifiers.lowercase) {
    value = value.toLocaleLowerCase();
  } else if (props.modelModifiers.number) {
    value = +value;
  }

  emit('update:modelValue', value);
  emit('change', value);
}
</script>
<style>
.input-ui input[type='color'] {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
