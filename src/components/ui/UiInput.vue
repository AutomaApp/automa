<template>
  <div class="inline-block input-ui">
    <label class="relative">
      <span
        v-if="label"
        class="text-sm dark:text-gray-200 text-gray-600 mb-1 ml-1"
      >
        {{ label }}
      </span>
      <div class="flex items-center">
        <slot name="prepend">
          <v-remixicon
            v-if="prependIcon"
            class="ml-2 dark:text-gray-200 text-gray-600 absolute left-0"
            :name="prependIcon"
          ></v-remixicon>
        </slot>
        <input
          v-autofocus="autofocus"
          v-bind="{
            readonly: disabled || readonly || null,
            placeholder,
            type,
            autofocus,
          }"
          class="py-2 px-4 rounded-lg w-full bg-input bg-transparent transition"
          :class="{
            'opacity-75 pointer-events-none': disabled,
            'pl-10': prependIcon || $slots.prepend,
          }"
          :value="modelValue"
          @keydown="$emit('keydown', $event)"
          @input="emitValue"
        />
      </div>
    </label>
  </div>
</template>
<script>
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
    prependIcon: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'change', 'keydown'],
  setup(props, { emit }) {
    function emitValue(event) {
      let { value } = event.target;

      if (props.modelModifiers.lowercase) {
        value = value.toLocaleLowerCase();
      }

      emit('update:modelValue', value);
      emit('change', value);
    }

    return {
      emitValue,
    };
  },
};
</script>
