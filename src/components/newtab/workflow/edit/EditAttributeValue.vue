<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-input
      :model-value="data.attributeName"
      placeholder="Attribute name"
      class="mt-3 w-full"
      @change="updateData({ attributeName: $event })"
    />
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
