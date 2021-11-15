<template>
  <div class="mb-2 mt-4 space-y-2">
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      placeholder="Description"
      @change="updateData({ description: $event })"
    />
    <ui-input
      v-if="!data.activeTab"
      :model-value="data.url"
      title="URL"
      class="w-full"
      placeholder="http://example.com/"
      @change="updateData({ url: $event })"
    />
    <a
      href="https://github.com/Kholid060/automa/wiki/Features#reference-data"
      rel="noopener"
      class="text-primary inline-block text-sm"
      target="_blank"
      style="margin-top: 0"
    >
      Learn how to add dynamic data
    </a>
    <ui-checkbox
      :model-value="data.updatePrevTab"
      class="leading-tight"
      title="Use the previously opened new tab instead of creating a new one"
      @change="updateData({ updatePrevTab: $event })"
    >
      Update previously opened tab
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.active"
      @change="updateData({ active: $event })"
    >
      Set as active tab
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.inGroup"
      @change="updateData({ inGroup: $event })"
    >
      Add tab to group
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
