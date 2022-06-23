<template>
  <div id="workflow-edit-block" class="px-4 overflow-auto scroll pb-1">
    <div
      class="sticky top-0 z-20 bg-white dark:bg-gray-800 pb-4 mb-2 flex items-center space-x-2"
    >
      <button @click="$emit('close')">
        <v-remixicon name="riArrowLeftLine" />
      </button>
      <p class="font-semibold inline-block capitalize">
        {{ t(`workflow.blocks.${data.id}.name`) }}
      </p>
      <a
        :title="t('common.docs')"
        :href="`https://docs.automa.site/blocks/${data.id}.html`"
        rel="noopener"
        target="_blank"
        class="text-gray-600 dark:text-gray-200"
      >
        <v-remixicon name="riInformationLine" size="20" />
      </a>
      <div class="flex-grow"></div>
      <ui-switch
        v-if="data.id !== 'trigger'"
        v-tooltip="
          t(
            `workflow.blocks.base.toggle.${
              blockData.disableBlock ? 'enable' : 'disable'
            }`
          )
        "
        :model-value="!blockData.disableBlock"
        @change="$emit('update', { ...blockData, disableBlock: !$event })"
      />
    </div>
    <component
      :is="components[data.editComponent]"
      v-if="blockData"
      :key="data.itemId || data.blockId"
      v-model:data="blockData"
      :block-id="data.blockId"
      v-bind="{
        editor: data.id === 'conditions' ? editor : null,
        connections: data.id === 'wait-connections' ? data.connections : null,
      }"
    />
    <on-block-error
      v-if="!excludeOnError.includes(data.id)"
      :key="data.itemId || data.blockId"
      :data="data"
      class="mt-4"
      @change="$emit('update', { ...blockData, onError: $event })"
    />
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { excludeOnError } from '@/utils/shared';
import OnBlockError from './edit/OnBlockError.vue';

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

const { t } = useI18n();

const blockData = computed({
  get() {
    return props.data.data;
  },
  set(data) {
    emit('update', data);
  },
});
</script>
<style>
#workflow-edit-block hr {
  @apply dark:border-gray-700 dark:border-opacity-40 my-4;
}
</style>
