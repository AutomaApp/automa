<template>
  <div class="input-ui inline-block">
    <label
      v-if="label || $slots.label"
      :for="componentId"
      class="ml-1 inline-block text-sm leading-none text-gray-600 dark:text-gray-200"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <div class="relative flex w-full items-center">
      <slot name="prepend">
        <v-remixicon
          v-if="prependIcon"
          class="absolute left-0 ml-2 text-gray-600 dark:text-gray-200"
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
          statusColors[status],
          inputClass,
          {
            'opacity-75 pointer-events-none': disabled,
            'pl-10': prependIcon || $slots.prepend,
            'appearance-none': list,
          },
        ]"
        :value="modelValue"
        class="bg-input w-full rounded-lg bg-transparent py-2 px-4 transition"
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
  status: {
    type: String,
    default: '',
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

const statusColors = {
  error: 'ring-red-400 ring-2 focus:ring-red-400 focus:ring-2',
};

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
