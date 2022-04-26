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
      :is="data.editComponent"
      v-if="blockData"
      :key="data.blockId"
      v-model:data="blockData"
      :block-id="data.blockId"
      v-bind="{
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
<script>
import { computed, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { tasks } from '@/utils/shared';
import { parseJSON } from '@/utils/helper';
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

export default {
  components: { ...components, OnBlockError },
  props: {
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
  },
  emits: ['close', 'update', 'update:autocomplete'],
  setup(props, { emit }) {
    const excludeOnError = [
      'webhook',
      'while-loop',
      'element-exists',
      'conditions',
      'trigger',
    ];

    const { t } = useI18n();
    const autocompleteData = ref({
      common: {
        table: {},
        globalData: [],
        activeTabUrl: '',
        $date: '',
        $randint: '',
        $getLength: '',
      },
    });

    const blockData = computed({
      get() {
        return props.data.data || {};
      },
      set(value) {
        emit('update', value);
      },
    });
    const autocompleteList = computed(() => ({
      ...autocompleteData.value.common,
      ...autocompleteData.value[props.data.itemId || props.data.blockId],
    }));

    provide('autocompleteData', autocompleteList);

    const dataKeywords = {
      loopId: 'loopData',
      refKey: 'googleSheets',
      variableName: 'variables',
    };
    function addAutocompleteData(id, name, data) {
      if (!autocompleteData.value[id]) autocompleteData.value[id] = {};

      if (!tasks[name].autocomplete) return;

      tasks[name].autocomplete.forEach((key) => {
        const variableNotAssigned =
          key === 'variableName' && !data.assignVariable;
        if (!data[key] || variableNotAssigned) return;

        const keyword = dataKeywords[key];
        if (!autocompleteData.value[id][keyword]) {
          autocompleteData.value[id][keyword] = {};
        }

        autocompleteData.value[id][keyword][data[key]] = '';
      });
    }
    function getGroupBlockData(blocks, currentItemId) {
      let itemFound = currentItemId || true;
      const blockId = currentItemId || props.data.blockId;

      for (let index = blocks.length - 1; index > 0; index -= 1) {
        const { id, data, itemId } = blocks[index];

        if (itemFound) {
          addAutocompleteData(blockId, id, data);
        } else {
          itemFound = itemId === currentItemId;
        }
      }
    }
    function traceBlockData(
      blockId,
      { name, inputs, data, id },
      blocks,
      maxDepth = 20
    ) {
      const notFirstDepth = maxDepth !== 20;

      if (maxDepth === 0 || (blockId === id && notFirstDepth)) return;

      if (notFirstDepth) {
        if (name === 'blocks-group') getGroupBlockData(data.blocks);
        else addAutocompleteData(props.data.blockId, name, data);
      }

      inputs?.input_1?.connections.forEach(({ node }) => {
        traceBlockData(blockId, blocks[node], blocks, maxDepth - 1);
      });
    }

    watch(
      () => [props.data.blockId, props.data.itemId],
      () => {
        const enableAutocomplete =
          props.workflow.settings?.inputAutocomplete ?? true;

        if (!enableAutocomplete) return;

        const id = props.data.blockId;
        const isDataChanging =
          !props.autocomplete || !props.autocomplete[id] || props.dataChanged;
        if (isDataChanging) {
          const blocks = props.editor.export().drawflow.Home.data;
          const currentBlock = blocks[id];

          if (Object.keys(blocks).length > 32) return;

          if (props.data.isInGroup)
            getGroupBlockData(currentBlock.data.blocks, props.data.itemId);

          traceBlockData(props.data.blockId, currentBlock, blocks);
        }

        props.workflow.table?.forEach((column) => {
          autocompleteData.value.common.table[column.name] = '';
        });

        const workflowGlobalData = props.workflow.globalData;
        autocompleteData.value.common.globalData = parseJSON(
          workflowGlobalData,
          workflowGlobalData
        );
      },
      { immediate: true }
    );
    watch(
      autocompleteData,
      () => {
        emit('update:autocomplete', autocompleteData.value);
      },
      { deep: true }
    );

    return {
      t,
      blockData,
      excludeOnError,
    };
  },
};
</script>
<style>
#workflow-edit-block hr {
  @apply dark:border-gray-700 dark:border-opacity-40 my-4;
}
</style>
