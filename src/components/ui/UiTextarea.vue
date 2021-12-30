<template>
  <label :class="[block ? 'block' : 'inline-block']">
    <span v-if="label" class="text-gray-500 text-sm ml-2 block">{{
      label
    }}</span>
    <textarea
      ref="textarea"
      v-bind="{ value: modelValue, placeholder, maxlength: max }"
      class="ui-textarea w-full ui-input rounded-lg px-4 py-2 transition bg-input"
      :class="{ 'overflow-hidden resize-none': autoresize }"
      :style="{ height }"
      @input="emitValue"
    ></textarea>
  </label>
</template>
<script>
import { ref, onMounted } from 'vue';

export default {
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    autoresize: {
      type: Boolean,
      default: false,
    },
    height: {
      type: [Number, String],
      default: '',
    },
    max: [Number, String],
    block: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const textarea = ref(null);

    function calcHeight() {
      if (!props.autoresize) return;

      textarea.value.style.height = 'auto';
      textarea.value.style.height = `${textarea.value.scrollHeight}px`;
    }
    function emitValue(event) {
      let { value } = event.target;
      const maxLength = Math.abs(props.max);

      if (value.length > maxLength) {
        value = value.slice(0, maxLength);
      }

      emit('update:modelValue', value);
      emit('change', value);
      calcHeight();
    }

    onMounted(calcHeight);

    return {
      textarea,
      emitValue,
    };
  },
};
</script>
