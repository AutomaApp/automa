<template>
  <base-edge
    :id="id"
    :style="style"
    :path="path[0]"
    :marker-end="markerEnd"
    :label="label"
    :label-x="path[1]"
    :label-y="path[2]"
    :label-style="{ fill: 'white' }"
    :label-show-bg="true"
    :label-bg-style="{ fill: '#3b82f6' }"
    :label-bg-padding="[2, 4]"
    :label-bg-border-radius="2"
  />
</template>
<script setup>
import { computed } from 'vue';
import { BaseEdge, getBezierPath, getSmoothStepPath } from '@vue-flow/core';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  sourceX: {
    type: Number,
    required: true,
  },
  sourceY: {
    type: Number,
    required: true,
  },
  targetX: {
    type: Number,
    required: true,
  },
  targetY: {
    type: Number,
    required: true,
  },
  sourcePosition: {
    type: String,
    required: true,
  },
  targetPosition: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  markerEnd: {
    type: String,
    required: false,
    default: '',
  },
  label: {
    type: String,
    required: false,
    default: '',
  },
  style: {
    type: Object,
    required: false,
    default: null,
  },
});

const path = computed(() => {
  const options = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  };

  if (props.sourceX > props.targetX) {
    return getSmoothStepPath(options);
  }

  return getBezierPath(options);
});
</script>
<script>
export default {
  inheritAttrs: false,
};
</script>
