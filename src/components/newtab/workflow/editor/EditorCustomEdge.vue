<template>
  <path
    :id="id"
    :style="style"
    class="vue-flow__edge-path"
    :d="edgePath"
    :marker-end="markerEnd"
  />
</template>
<script setup>
import { computed } from 'vue';
import { getBezierPath, getSmoothStepPath } from '@braks/vue-flow';

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
