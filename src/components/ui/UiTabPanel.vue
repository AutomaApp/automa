<template>
  <render />
</template>
<script setup>
import { inject, h, useSlots } from 'vue';

/* eslint-disable-next-line */
const props = defineProps({
  value: {
    type: [String, Number],
    default: '',
  },
  activeClass: {
    type: String,
    default: 'ui-tab-panel--active',
  },
  cache: Boolean,
});

const slots = useSlots();
const uiTabPanels = inject('ui-tab-panels', {});

const render = () => {
  const isActive = props.value === uiTabPanels.modelValue.value;
  const cache = props.cache || uiTabPanels.cache.value;
  const component = h(
    'div',
    {
      class: [props.activeClass, 'ui-tab-panel'],
      style: {
        display: cache && !isActive ? 'none' : null,
      },
    },
    slots
  );

  if (props.cache || isActive) return component;

  return null;
};
</script>
