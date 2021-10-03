<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <div class="flex items-center mt-3 space-x-2">
      <ui-input
        :model-value="data.scrollX || 0"
        type="number"
        label="Scroll horizontal"
        @change="updateData({ scrollX: +$event })"
      />
      <ui-input
        :model-value="data.scrollY || 0"
        type="number"
        label="Scroll vertical"
        @change="updateData({ scrollY: +$event })"
      />
    </div>
  </edit-interaction-base>
</template>
<script setup>
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
