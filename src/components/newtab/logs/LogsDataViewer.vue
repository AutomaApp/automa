<template>
  <div class="flex items-center">
    <ui-input v-model="fileName" placeholder="File name" title="File name" />
    <div class="flex-grow"></div>
    <ui-popover>
      <template #trigger>
        <ui-button variant="accent">
          <span>Export data</span>
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
          as {{ type.name }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </div>
  <prism-editor
    :model-value="dataStr"
    :highlight="highlighter"
    :class="editorClass"
    readonly
    class="my-editor p-4 bg-gray-900 rounded-lg mt-4"
  ></prism-editor>
</template>
<script setup>
import { ref } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import { dataExportTypes } from '@/utils/shared';
import dataExporter, { generateJSON } from '@/utils/data-exporter';
import 'vue-prism-editor/dist/prismeditor.min.css';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

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

const data = generateJSON(Object.keys(props.log.data), props.log.data);
const dataStr = JSON.stringify(data, null, 2);

const fileName = ref(props.log.name);
const highlighter = (code) => highlight(code, languages.json);

function exportData(type) {
  dataExporter(data, { name: fileName.value, type }, true);
}
</script>
<style scoped>
.my-editor {
  color: #ccc;
  font-family: JetBrains Mono, Fira code, Fira Mono, Consolas, Menlo, Courier,
    monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 5px;
}
.prism-editor__textarea:focus {
  outline: none;
}
</style>
