<template>
  <div class="take-screenshot">
    <ui-checkbox
      :model-value="data.fullPage"
      class="mb-2"
      @change="updateData({ fullPage: $event })"
    >
      {{ t('workflow.blocks.take-screenshot.fullPage') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.saveToComputer"
      class="mb-2"
      @change="updateData({ saveToComputer: $event })"
    >
      {{ t('workflow.blocks.take-screenshot.saveToComputer') }}
    </ui-checkbox>
    <div v-if="data.saveToComputer" class="flex items-center my-2">
      <ui-input
        :model-value="data.fileName"
        :placeholder="t('common.fileName')"
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
    <div class="bg-box-transparent px-4 mb-2 py-2 rounded-lg flex items-center">
      <input
        :value="data.quality"
        :title="t('workflow.blocks.take-screenshot.imageQuality')"
        class="focus:outline-none flex-1"
        type="range"
        min="0"
        max="100"
        @change="updateQuality"
      />
      <span class="w-12 text-right">{{ data.quality }}%</span>
    </div>
    <ui-checkbox
      :model-value="data.saveToColumn"
      class="mt-3"
      @change="updateData({ saveToColumn: $event })"
    >
      {{ t('workflow.blocks.take-screenshot.saveToColumn') }}
    </ui-checkbox>
    <div v-if="data.saveToColumn" class="flex items-center mt-1">
      <ui-select
        :model-value="data.dataColumn"
        placeholder="Data column"
        class="mr-2 flex-1"
        @change="updateData({ dataColumn: $event })"
      >
        <option
          v-for="column in workflow.data.value.dataColumns"
          :key="column.name"
          :value="column.name"
        >
          {{ column.name }}
        </option>
      </ui-select>
      <ui-button
        icon
        title="Data columns"
        @click="workflow.showDataColumnsModal(true)"
      >
        <v-remixicon name="riKey2Line" />
      </ui-button>
    </div>
  </div>
</template>
<script setup>
import { inject, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { objectHasKey } from '@/utils/helper';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const workflow = inject('workflow');

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateQuality({ target }) {
  let quality = +target.value;

  if (quality <= 0) quality = 0;
  if (quality >= 100) quality = 100;

  updateData({ quality });
}

onMounted(() => {
  if (objectHasKey(props.data, 'saveToComputer')) return;

  updateData({ saveToComputer: true, saveToColumn: false });
});
</script>
