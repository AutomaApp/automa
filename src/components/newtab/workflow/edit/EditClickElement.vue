<template>
  <ui-textarea
    :model-value="data.description"
    autoresize
    placeholder="Description"
    class="w-full mb-2"
    @change="updateData({ description: $event })"
  />
  <div class="flex items-center">
    <ui-input
      :model-value="data.selector"
      placeholder="Element selector"
      class="mr-4"
      @change="updateData({ selector: $event })"
    />
    <ui-checkbox
      :model-value="data.multiple"
      @change="updateData({ multiple: $event })"
    >
      Multiple
    </ui-checkbox>
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
