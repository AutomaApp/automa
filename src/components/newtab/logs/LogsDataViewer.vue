<template>
  <div class="flex items-center">
    <ui-input
      v-model="fileName"
      :placeholder="t('common.fileName')"
      :title="t('common.fileName')"
    />
    <div class="flex-grow"></div>
    <ui-popover>
      <template #trigger>
        <ui-button variant="accent">
          <span>{{ t('log.exportData.title') }}</span>
          <v-remixicon name="riArrowDropDownLine" class="ml-2 -mr-1" />
        </ui-button>
      </template>
      <ui-list class="space-y-1">
        <ui-list-item
          v-for="type in dataExportTypes"
          :key="type.id"
          v-close-popover
          class="cursor-pointer"
          @click="exportData(type.id)"
        >
          {{ t(`log.exportData.types.${type.id}`) }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </div>
  <prism-editor
    :model-value="jsonData"
    :highlight="highlighter('json')"
    :class="editorClass"
    readonly
    class="my-editor p-4 bg-gray-900 rounded-lg mt-4"
  ></prism-editor>
</template>
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PrismEditor } from 'vue-prism-editor';
import { highlighter } from '@/lib/prism';
import { dataExportTypes } from '@/utils/shared';
import dataExporter, { generateJSON } from '@/utils/data-exporter';

const props = defineProps({
  log: {
    type: Object,
    default: () => ({}),
  },
  editorClass: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();

const data = Array.isArray(props.log.data)
  ? props.log.data
  : generateJSON(Object.keys(props.log.data), props.log.data);
const dataStr = JSON.stringify(data, null, 2);
const jsonData =
  dataStr.length >= 5e4 ? `${dataStr.slice(0, 5e4)}\n...` : dataStr;

const fileName = ref(props.log.name);

function exportData(type) {
  dataExporter(data, { name: fileName.value, type }, true);
}
</script>
