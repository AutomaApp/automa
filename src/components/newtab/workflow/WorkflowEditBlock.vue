<template>
  <div id="workflow-edit-block" class="scroll h-full overflow-auto px-4 py-1">
    <div
      class="sticky top-0 z-20 mb-2 flex items-center space-x-2 bg-white pb-4 dark:bg-gray-800"
    >
      <button @click="handleClose">
        <v-remixicon name="riArrowLeftLine" />
      </button>
      <p class="inline-block font-semibold capitalize">
        {{ getBlockName() }}
      </p>
      <div class="grow"></div>
      <a
        :title="t('common.docs')"
        :href="`https://docs.automa.site/blocks/${data.id}.html`"
        rel="noopener"
        target="_blank"
        class="text-gray-600 dark:text-gray-200"
      >
        <v-remixicon name="riInformationLine" />
      </a>
    </div>
    <component
      :is="getEditComponent()"
      v-if="blockData"
      :key="data.itemId || data.blockId"
      v-model:data="blockData"
      :block-id="data.blockId"
      v-bind="{
        fullData: data.id === 'conditions' ? data : null,
        editor: data.id === 'conditions' ? editor : null,
        connections: data.id === 'wait-connections' ? data.connections : null,
      }"
    />
  </div>
</template>
<script setup>
import customEditComponents from '@business/blocks/editComponents';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';

const editComponents = require.context(
  './edit',
  false,
  /^(?:.*\/)?Edit[^/]*\.vue$/
);
/* eslint-disable-next-line */
const components = editComponents.keys().reduce((acc, key) => {
  const name = key.replace(/(.\/)|\.vue$/g, '');
  const componentObj = editComponents(key)?.default ?? {};

  acc[name] = componentObj;

  return acc;
}, {});

Object.assign(components, customEditComponents());

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
  workflow: {
    type: Object,
    default: () => ({}),
  },
  autocomplete: {
    type: Object,
    default: () => ({}),
  },
  dataChanged: Boolean,
});
const emit = defineEmits(['close', 'update', 'update:autocomplete']);

const { t, te } = useI18n();
const toast = useToast();

const blockData = computed({
  get() {
    return props.data.data;
  },
  set(data) {
    emit('update', data);
  },
});

function isGoogleSheetsBlock() {
  return ['google-sheets'].includes(props.data.id);
}

function validateBeforeClose() {
  // 检查是否为Google Sheets相关区块
  if (isGoogleSheetsBlock()) {
    // 检查spreadsheetId是否为空，且不是create或add-sheet操作
    const { spreadsheetId, type, range } = blockData.value;
    const isNotCreateAction = !['create', 'add-sheet'].includes(type);

    if (isNotCreateAction) {
      const errors = [];

      if (!spreadsheetId) {
        errors.push(
          t(
            'workflow.blocks.google-sheets.spreadsheetId.required',
            'Spreadsheet ID is required'
          )
        );
      }

      if (!range) {
        errors.push(
          t('workflow.blocks.google-sheets.range.required', 'Range is required')
        );
      }

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
        return false;
      }
    }
  }
  return true;
}

function handleClose() {
  if (validateBeforeClose()) {
    emit('close');
  }
}

function getEditComponent() {
  const editComp = props.data.editComponent;
  if (typeof editComp === 'object') return editComp;

  return components[editComp];
}
function getBlockName() {
  const key = `workflow.blocks.${props.data.id}.name`;

  return te(key) ? t(key) : props.data.name;
}
</script>
<style>
#workflow-edit-block hr {
  @apply dark:border-gray-700 dark:border-opacity-40 my-4;
}
</style>
