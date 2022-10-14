<template>
  <div id="workflow-edit-block" class="px-4 overflow-auto scroll pb-1">
    <div
      class="sticky top-0 z-20 bg-white dark:bg-gray-800 pb-4 mb-2 flex items-center space-x-2"
    >
      <button @click="$emit('close')">
        <v-remixicon name="riArrowLeftLine" />
      </button>
      <p class="font-semibold inline-block capitalize">
        {{ getBlockName() }}
      </p>
      <div class="flex-grow"></div>
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import customEditComponents from '@business/blocks/editComponents';

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

const blockData = computed({
  get() {
    return props.data.data;
  },
  set(data) {
    emit('update', data);
  },
});

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
