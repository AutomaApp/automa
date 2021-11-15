<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      autoresize
      placeholder="Description"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.windowType"
      class="w-full"
      @change="updateData({ windowType: $event })"
    >
      <option value="main-window">Main window</option>
      <option value="iframe">Iframe</option>
    </ui-select>
    <ui-input
      v-if="data.windowType === 'iframe'"
      :model-value="data.selector"
      placeholder="Iframe element selector"
      class="mb-1 w-full"
      @change="updateData({ selector: $event })"
    />
  </div>
</template>
<script setup>
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
