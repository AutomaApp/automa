<template>
  <div :class="{ 'inline-block': !block }" class="ui-select cursor-pointer">
    <label
      v-if="label || $slots.label"
      :for="selectId"
      class="text-gray-600 dark:text-gray-200 text-sm ml-1"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </label>
    <div class="ui-select__content flex items-center w-full block relative">
      <v-remixicon
        v-if="prependIcon"
        size="20"
        :name="prependIcon"
        class="absolute text-gray-600 dark:text-gray-200 left-0 ml-2"
      />
      <select
        :id="selectId"
        :disabled="disabled"
        :class="{
          'pl-8': prependIcon,
          'opacity-75 pointer-events-none': disabled,
        }"
        :value="modelValue"
        class="px-4 pr-10 transition rounded-lg bg-input bg-transparent py-2 z-10 appearance-none w-full h-full appearance-none"
        @change="emitValue"
      >
        <option v-if="placeholder" value="" disabled selected>
          {{ placeholder }}
        </option>
        <slot></slot>
      </select>
      <v-remixicon
        size="28"
        name="riArrowDropDownLine"
        class="absolute text-gray-600 dark:text-gray-200 mr-2 right-0"
      />
    </div>
  </div>
</template>
<script>
import { useComponentId } from '@/composable/componentId';

export default {
  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    prependIcon: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    modelModifiers: {
      type: Object,
      default: () => ({}),
    },
    block: Boolean,
    disabled: Boolean,
    showDetail: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const selectId = useComponentId('select');

    function emitValue(event) {
      let { value } = event.target;

      if (props.modelModifiers.number) {
        value = +value;
      }

      emit('update:modelValue', value);
      emit('change', value);
    }

    return {
      selectId,
      emitValue,
    };
  },
};
</script>
<style>
.ui-select__arrow {
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
}
.ui-select option,
.ui-select optgroup {
  @apply bg-gray-100 dark:bg-gray-700;
}
</style>
