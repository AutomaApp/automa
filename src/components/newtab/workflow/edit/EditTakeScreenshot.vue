<template>
  <div class="flex items-center mb-2 mt-8">
    <ui-input
      :model-value="data.fileName"
      placeholder="File name"
      class="flex-1 mr-2"
      title="File name"
      @change="updateData({ fileName: $event })"
    />
    <ui-select
      :model-value="data.ext || 'png'"
      placeholder="Type"
      @change="updateData({ ext: $event })"
    >
      <option value="png">PNG</option>
      <option value="jpeg">JPEG</option>
    </ui-select>
  </div>
  <p class="text-sm text-gray-600 ml-2">Image quality:</p>
  <div class="bg-box-transparent px-4 mb-4 py-2 rounded-lg flex items-center">
    <input
      :value="data.quality"
      title="Image quality"
      class="focus:outline-none flex-1"
      type="range"
      min="0"
      max="100"
      @change="updateQuality"
    />
    <span class="w-8 text-right">{{ data.quality }}</span>
  </div>
  <ui-checkbox
    v-if="false"
    :model-value="data.captureActiveTab"
    @change="updateData({ captureActiveTab: $event })"
  >
    Take screenshoot of active tab
  </ui-checkbox>
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
function updateQuality({ target }) {
  let quality = +target.value;

  if (quality <= 0) quality = 0;
  if (quality >= 100) quality = 100;

  updateData({ quality });
}
</script>
