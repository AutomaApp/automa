<template>
  <path
    :id="id"
    :style="style"
    class="vue-flow__edge-path"
    :d="edgePath[0]"
    :marker-end="markerEnd"
  />
  <edge-text
    v-if="label"
    :x="edgePath[1]"
    :y="edgePath[2]"
    :label="label"
    :label-style="{ fill: 'white' }"
    :label-show-bg="true"
    :label-bg-style="{ fill: '#3b82f6' }"
    :label-bg-padding="[2, 4]"
    :label-bg-border-radius="2"
  />
</template>
<script setup>
import { computed } from 'vue';
import { getBezierPath, getSmoothStepPath, EdgeText } from '@vue-flow/core';

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

const edgePath = computed(() => {
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
