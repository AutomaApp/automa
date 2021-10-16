<template>
  <slot name="prepend" />
  <ui-textarea
    :model-value="data.description"
    autoresize
    placeholder="Description"
    class="w-full mb-2"
    @change="updateData({ description: $event })"
  />
  <ui-input
    v-if="!hideSelector"
    :model-value="data.selector"
    placeholder="Element selector"
    class="mb-1 w-full"
    @change="updateData({ selector: $event })"
  />
  <template v-if="!hideSelector">
    <ui-checkbox
      v-if="!data.disableMultiple && !hideMultiple"
      class="mr-6"
      :model-value="data.multiple"
      @change="updateData({ multiple: $event })"
    >
      Multiple
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.markEl"
      title="An element will not be selected after marked"
      @change="updateData({ markEl: $event })"
    >
      Mark element
    </ui-checkbox>
  </template>
  <slot></slot>
</template>
<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  hideSelector: {
    type: Boolean,
    default: false,
  },
  hideMultiple: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:data', 'change']);

function updateData(value) {
  const payload = { ...props.data, ...value };

  emit('update:data', payload);
  emit('change', payload);
}
</script>
