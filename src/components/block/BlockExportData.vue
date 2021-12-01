<template>
  <div :id="componentId" class="p-4">
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon
          name="riDownloadLine"
          size="20"
          class="inline-block mr-1"
        />
        <span>{{ t('workflow.blocks.export-data.name') }}</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <input
      v-model="block.data.name"
      :placeholder="t('common.fileName')"
      class="bg-input rounded-lg transition w-40 mb-2 py-2 px-4 block"
    />
    <ui-select v-model="block.data.type" class="w-40" placeholder="Export as">
      <option v-for="type in dataExportTypes" :key="type.id" :value="type.id">
        {{ type.name }}
      </option>
    </ui-select>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { watch } from 'vue';
import emitter from 'tiny-emitter/instance';
import { dataExportTypes } from '@/utils/shared';
import { debounce } from '@/utils/helper';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const componentId = useComponentId('block-delay');
const block = useEditorBlock(`#${componentId}`, props.editor);

watch(
  () => block.data,
  debounce((value, oldValue) => {
    if (Object.keys(oldValue).length === 0) return;

    props.editor.updateNodeDataFromId(block.id, value);
    emitter.emit('editor:data-changed', block.id);
  }, 250),
  { deep: true }
);
</script>
