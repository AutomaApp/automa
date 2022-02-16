<template>
  <div
    :class="[
      tabTypes[type] || tabTypes['default'],
      { [color]: type === 'fill' },
    ]"
    aria-role="tablist"
    class="ui-tabs text-gray-600 dark:text-gray-200 flex space-x-1 items-center relative"
    @mouseleave="showHoverIndicator = false"
  >
    <div
      v-show="showHoverIndicator"
      ref="hoverIndicator"
      class="ui-tabs__indicator z-0 absolute left-0 rounded-lg bg-box-transparent"
      style="top: 50%; transform: translate(0, -50%)"
    ></div>
    <slot></slot>
  </div>
</template>
<script setup>
import { provide, toRefs, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'fill'].includes(value),
  },
  color: {
    type: String,
    default: 'bg-box-transparent',
  },
  small: Boolean,
  fill: Boolean,
});
const emit = defineEmits(['update:modelValue', 'change']);

const tabTypes = {
  default: 'border-b',
  fill: 'p-2 rounded-lg',
};

const hoverIndicator = ref(null);
const showHoverIndicator = ref(false);

function updateActive(id) {
  emit('change', id);
  emit('update:modelValue', id);
}
function hoverHandler({ target }) {
  const isFill = props.type === 'fill';

  if (target.classList.contains('is-active') && isFill) {
    hoverIndicator.value.style.display = 'none';

    return;
  }

  const { height, width } = target.getBoundingClientRect();
  const elHeight = isFill ? height + 3 : height - 11;

  showHoverIndicator.value = true;
  hoverIndicator.value.style.width = `${width}px`;
  hoverIndicator.value.style.height = `${elHeight}px`;
  hoverIndicator.value.style.display = 'inline-block';
  hoverIndicator.value.style.transform = `translate(${target.offsetLeft}px, -50%)`;
}

provide('ui-tabs', {
  updateActive,
  hoverHandler,
  ...toRefs(props),
});
</script>
<style>
.ui-tabs__indicator {
  min-height: 24px;
  min-width: 50px;
  transition-duration: 200ms;
  transition-property: transform, width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
