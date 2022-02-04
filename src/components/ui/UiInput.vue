<template>
  <div class="inline-block input-ui">
    <label v-if="label || $slots.label" :for="componentId">
      <span class="text-sm dark:text-gray-200 text-gray-600 ml-1">
        <slot name="label">{{ label }}</slot>
      </span>
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
          autofocus,
          min,
          max,
          list,
        }"
        :id="componentId"
        v-autofocus="autofocus"
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
        @blur="$emit('blur', $event)"
        @input="emitValue"
      />
      <slot name="append" />
    </div>
  </div>
</template>
<script>
import { useComponentId } from '@/composable/componentId';
/* eslint-disable vue/require-prop-types */
export default {
  props: {
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
      type: [String, Number],
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
  },
  emits: ['update:modelValue', 'change', 'keydown', 'blur'],
  setup(props, { emit }) {
    const componentId = useComponentId('ui-input');

    function emitValue(event) {
      let { value } = event.target;

      if (props.modelModifiers.lowercase) {
        value = value.toLocaleLowerCase();
      } else if (props.modelModifiers.number) {
        value = +value;
      }

      emit('update:modelValue', value);
      emit('change', value);
    }

    return {
      emitValue,
      componentId,
    };
  },
};
</script>
