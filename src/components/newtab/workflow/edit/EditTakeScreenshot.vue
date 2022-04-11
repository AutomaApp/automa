<template>
  <template v-if="data.ext === 'jpeg'">
    <p class="text-sm text-gray-600 dark:text-gray-200 ml-2">Image quality</p>
    <div class="bg-box-transparent px-4 mb-4 py-2 rounded-lg flex items-center">
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
  </template>
  <div class="take-screenshot">
    <ui-checkbox
      :model-value="data.fullPage"
      @change="updateData({ fullPage: $event })"
    >
      {{ t('workflow.blocks.take-screenshot.fullPage') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.saveToComputer"
      class="mt-4"
      @change="updateData({ saveToComputer: $event })"
    >
      {{ t('workflow.blocks.take-screenshot.saveToComputer') }}
    </ui-checkbox>
    <div v-if="data.saveToComputer" class="flex items-center mt-1">
      <ui-autocomplete
        :items="autocomplete"
        :trigger-char="['{{', '}}']"
        block
        hide-empty
        class="flex-1 mr-2"
      >
        <ui-input
          :model-value="data.fileName"
          :placeholder="t('common.fileName')"
          autocomplete="off"
          class="flex-1 mr-2"
          title="File name"
          @change="updateData({ fileName: $event })"
        />
      </ui-autocomplete>
      <ui-select
        :model-value="data.ext || 'png'"
        placeholder="Type"
        @change="updateData({ ext: $event })"
      >
        <option value="png">PNG</option>
        <option value="jpeg">JPEG</option>
      </ui-select>
    </div>
    <ui-checkbox
      :model-value="data.saveToColumn"
      class="mt-4"
      @change="updateData({ saveToColumn: $event })"
    >
      {{ t('workflow.blocks.take-screenshot.saveToColumn') }}
    </ui-checkbox>
    <ui-select
      v-if="data.saveToColumn"
      :model-value="data.dataColumn"
      placeholder="Select column"
      class="w-full mt-1"
      @change="updateData({ dataColumn: $event })"
    >
      <option
        v-for="column in workflow.data.value.table"
        :key="column.id || column.name"
        :value="column.id || column.name"
      >
        {{ column.name }}
      </option>
    </ui-select>
    <ui-checkbox
      :model-value="data.assignVariable"
      block
      class="mt-4"
      @change="updateData({ assignVariable: $event })"
    >
      {{ t('workflow.variables.assign') }}
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      :placeholder="t('workflow.variables.name')"
      :title="t('workflow.variables.name')"
      class="mt-1 w-full"
      @change="updateData({ variableName: $event })"
    />
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
  autocomplete: {
    type: Array,
    default: () => [],
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
