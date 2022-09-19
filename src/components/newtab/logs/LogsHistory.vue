<template>
  <router-link
    v-if="parentLog"
    replace
    :to="'/logs/' + currentLog.parentLog?.id || currentLog.collectionLogId"
    class="mb-4 flex"
  >
    <v-remixicon name="riArrowLeftLine" class="mr-2" />
    {{ t('log.goBack', { name: parentLog.name }) }}
  </router-link>
  <div class="flex items-start">
    <div class="flex-1">
      <div class="rounded-lg bg-gray-900 dark:bg-gray-800 text-gray-100 dark">
        <div
          class="border-b px-4 pt-4 flex items-center text-gray-200 pb-4 mb-4"
        >
          <div v-if="currentLog.status === 'error' && errorBlock">
            <p class="leading-tight line-clamp">
              {{ errorBlock.message }}
              <a
                v-if="errorBlock.messageId"
                :href="`https://docs.automa.site/guide/workflow-errors.html#${errorBlock.messageId}`"
                target="_blank"
                title="About the error"
                @click.stop
              >
                <v-remixicon
                  name="riArrowLeftLine"
                  size="20"
                  class="text-gray-300 inline-block"
                  rotate="135"
                />
              </a>
            </p>
            <p class="cursor-pointer" title="Jump to item" @click="jumpToError">
              On the {{ errorBlock.name }} block
              <v-remixicon
                name="riArrowLeftLine"
                class="inline-block -ml-1"
                size="18"
                rotate="135"
              />
            </p>
          </div>
          <slot name="header-prepend" />
          <div class="flex-grow" />
          <ui-input
            v-model="state.search"
            :placeholder="t('common.search')"
            prepend-icon="riSearch2Line"
          />
        </div>
        <div
          id="log-history"
          style="max-height: 600px"
          class="scroll p-4 overflow-auto"
        >
          <slot name="prepend" />
          <div class="text-sm font-mono space-y-1 w-full overflow-auto">
            <div
              v-for="(item, index) in history"
              :key="item.id || index"
              :disabled="!ctxData[item.id]"
              :class="{ 'bg-box-transparent': item.id === state.itemId }"
              hide-header-icon
              class="hoverable rounded-md px-2 w-full text-left focus:ring-0 py-1 rounded-md group cursor-default flex items-start"
              @click="setActiveLog(item)"
            >
              <div
                style="min-width: 54px"
                class="flex-shrink-0 mr-4 text-overflow text-gray-400"
              >
                <span
                  v-if="item.timestamp"
                  :title="
                    dayjs(item.timestamp).format('YYYY-MM-DDTHH:mm:ss.SSS')
                  "
                >
                  {{ dayjs(item.timestamp).format('HH:mm:ss') }}
                  {{ `(${countDuration(0, item.duration || 0).trim()})` }}
                </span>
                <span v-else :title="`${Math.round(item.duration / 1000)}s`">
                  {{ countDuration(0, item.duration || 0) }}
                </span>
              </div>
              <span
                :class="logsType[item.type]?.color"
                :title="item.type"
                class="w-2/12 flex-shrink-0 text-overflow"
              >
                <v-remixicon
                  :name="logsType[item.type]?.icon"
                  size="18"
                  class="inline-block -mr-1 align-text-top"
                />
                {{ item.name }}
              </span>
              <span
                :title="`${t('common.description')} (${item.description})`"
                class="ml-2 w-2/12 text-overflow flex-shrink-0"
              >
                {{ item.description }}
              </span>
              <p
                :title="item.message"
                class="text-sm line-clamp ml-2 flex-1 leading-tight text-gray-600 dark:text-gray-200"
              >
                {{ item.message }}
                <a
                  v-if="item.messageId"
                  :href="`https://docs.automa.site/guide/workflow-errors.html#${item.messageId}`"
                  target="_blank"
                  title="About the error"
                  @click.stop
                >
                  <v-remixicon
                    name="riArrowLeftLine"
                    size="20"
                    class="text-gray-300 inline-block"
                    rotate="135"
                  />
                </a>
              </p>
              <router-link
                v-if="item.logId"
                v-slot="{ navigate }"
                :to="{ name: 'logs-details', params: { id: item.logId } }"
                custom
              >
                <v-remixicon
                  title="Open log detail"
                  class="ml-2 text-gray-300 cursor-pointer"
                  size="20"
                  name="riFileTextLine"
                  @click.stop="navigate"
                />
              </router-link>
              <router-link
                v-if="getBlockPath(item.blockId)"
                v-show="currentLog.workflowId && item.blockId"
                :to="getBlockPath(item.blockId)"
              >
                <v-remixicon
                  name="riExternalLinkLine"
                  size="20"
                  title="Go to block"
                  class="text-gray-300 cursor-pointer ml-2 invisible group-hover:visible"
                />
              </router-link>
            </div>
            <slot name="append-items" />
          </div>
        </div>
      </div>
      <div
        v-if="currentLog.history.length >= 25"
        class="flex items-center justify-between mt-4"
      >
        <div>
          {{ t('components.pagination.text1') }}
          <select v-model="pagination.perPage" class="p-1 rounded-md bg-input">
            <option
              v-for="num in [25, 50, 75, 100, 150, 200]"
              :key="num"
              :value="num"
            >
              {{ num }}
            </option>
          </select>
          {{
            t('components.pagination.text2', {
              count: filteredLog.length,
            })
          }}
        </div>
        <ui-pagination
          v-model="pagination.currentPage"
          :per-page="pagination.perPage"
          :records="filteredLog.length"
        />
      </div>
    </div>
    <div
      v-if="state.itemId && activeLog"
      class="w-4/12 ml-8 rounded-lg bg-gray-900 dark:bg-gray-800 text-gray-100 dark"
    >
      <div class="p-4 relative">
        <v-remixicon
          name="riCloseLine"
          class="absolute top-2 right-2 cursor-pointer text-gray-500"
          @click="clearActiveItem"
        />
        <table class="w-full ctx-data-table">
          <thead>
            <tr>
              <td class="w-5/12"></td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-gray-300">Name</td>
              <td>{{ activeLog.name }}</td>
            </tr>
            <tr>
              <td class="text-gray-300">Description</td>
              <td>
                <p class="line-clamp leading-tight">
                  {{ activeLog.description }}
                </p>
              </td>
            </tr>
            <tr>
              <td class="text-gray-300">Status</td>
              <td class="capitalize">{{ activeLog.type }}</td>
            </tr>
            <tr>
              <td class="text-gray-300">Timestamp/Duration</td>
              <td>
                <span v-if="activeLog.timestamp">
                  {{ dayjs(activeLog.timestamp).format('DD MMM, HH:mm:ss') }}
                  /
                </span>
                {{ countDuration(0, activeLog.duration || 0).trim() }}
              </td>
            </tr>
            <tr v-if="activeLog.message">
              <td class="text-gray-300">Message</td>
              <td>
                <p class="line-clamp leading-tight">
                  {{ activeLog.message }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template v-if="ctxData[state.itemId]">
        <div class="px-4 pb-4 flex items-center">
          <p>Log data</p>
          <div class="flex-grow" />
          <ui-select v-model="state.activeTab">
            <option v-for="option in tabs" :key="option.id" :value="option.id">
              {{ option.name }}
            </option>
          </ui-select>
        </div>
        <div class="pb-4 px-2 log-data-prev">
          <shared-codemirror
            :model-value="logCtxData"
            readonly
            hide-lang
            lang="json"
            style="max-height: 460px"
            class="scroll"
          />
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
/* eslint-disable no-use-before-define */
import {
  computed,
  shallowReactive,
  defineAsyncComponent,
  shallowRef,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { countDuration } from '@/utils/helper';
import { getBlocks } from '@/utils/getSharedData';
import dayjs from '@/lib/dayjs';
import objectPath from 'object-path';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);
const blocks = getBlocks();

const props = defineProps({
  currentLog: {
    type: Object,
    default: () => ({}),
  },
  ctxData: {
    type: Object,
    default: () => ({}),
  },
  parentLog: {
    type: Object,
    default: null,
  },
});

const logsType = {
  success: {
    color: 'text-green-400',
    icon: 'riCheckLine',
  },
  stop: {
    color: 'text-yellow-400',
    icon: 'riStopLine',
  },
  stopped: {
    color: 'text-yellow-400',
    icon: 'riStopLine',
  },
  error: {
    color: 'text-red-400',
    icon: 'riErrorWarningLine',
  },
  finish: {
    color: 'text-blue-300',
    icon: 'riFlagLine',
  },
};
const tabs = [
  { id: 'all', name: 'All' },
  { id: 'referenceData.loopData', name: 'Loop data' },
  { id: 'referenceData.variables', name: 'Variables' },
  { id: 'referenceData.prevBlockData', name: 'Previous block data' },
  { id: 'replacedValue', name: 'Replaced value' },
];
const messageHasReferences = [
  'no-tab',
  'invalid-active-tab',
  'no-match-tab',
  'invalid-body',
  'element-not-found',
];

const { t, te } = useI18n();

const state = shallowReactive({
  itemId: '',
  search: '',
  activeTab: 'all',
});
const pagination = shallowReactive({
  perPage: 25,
  currentPage: 1,
});
const activeLog = shallowRef(null);

const translatedLog = computed(() =>
  props.currentLog.history.map(translateLog)
);
const filteredLog = computed(() => {
  const query = state.search.toLocaleLowerCase();

  return translatedLog.value.filter(
    (log) =>
      log.name.toLocaleLowerCase().includes(query) ||
      log.description?.toLocaleLowerCase().includes(query)
  );
});
const history = computed(() =>
  filteredLog.value.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  )
);
const errorBlock = computed(() => {
  if (props.currentLog.status !== 'error') return null;

  let block = props.currentLog.history.at(-1);
  if (!block || block.type !== 'error' || block.id < 25) return null;

  block = translateLog(block);

  let { name } = block;
  if (block.description) name += ` (${block.description})`;

  return {
    name,
    id: block.id,
    message: block.message,
    messageId: block.messageId,
  };
});
const logCtxData = computed(() => {
  if (!state.itemId || !props.ctxData[state.itemId]) return '';

  const data = props.ctxData[state.itemId];
  const logData =
    state.activeTab === 'all' ? data : objectPath.get(data, state.activeTab);

  return JSON.stringify(logData, null, 2);
});

function clearActiveItem() {
  state.itemId = '';
  activeLog.value = null;
}
function translateLog(log) {
  const copyLog = { ...log };
  const getTranslatation = (path, def) => {
    const params = typeof path === 'string' ? { path } : path;

    return te(params.path) ? t(params.path, params.params) : def;
  };

  if (['finish', 'stop'].includes(log.type)) {
    copyLog.name = t(`log.types.${log.type}`);
  } else {
    copyLog.name = getTranslatation(
      `workflow.blocks.${log.name}.name`,
      blocks[log.name].name
    );
  }

  if (copyLog.message && messageHasReferences.includes(copyLog.message)) {
    copyLog.messageId = `${copyLog.message}`;
  }

  copyLog.message = getTranslatation(
    { path: `log.messages.${log.message}`, params: log },
    log.message
  );

  return copyLog;
}
function setActiveLog(item) {
  state.itemId = item.id;
  activeLog.value = item;
}
function getBlockPath(blockId) {
  const { workflowId, teamId } = props.currentLog;
  let path = `/workflows/${workflowId}`;

  if (workflowId.startsWith('team') && teamId) {
    path = `/teams/${teamId}/workflows/${workflowId}`;
  }

  return `${path}?blockId=${blockId}`;
}
function jumpToError() {
  pagination.currentPage = Math.ceil(errorBlock.value.id / pagination.perPage);

  const element = document.querySelector('#log-history');
  if (!element) return;

  element.scrollTo(0, element.scrollHeight);
  document.documentElement.scrollTo(0, document.documentElement.scrollHeight);
}
</script>
<style>
.ctx-data-table {
  thead td {
    padding: 0;
  }
  td {
    @apply p-1;
  }
  tr {
    vertical-align: baseline;
  }
}
.log-data-prev .cm-editor {
  background-color: transparent;
  .cm-activeLine.cm-line {
    background-color: rgb(255 255 255 / 0.05) !important;
  }
  .cm-gutters,
  .cm-activeLineGutter,
  .cm-gutterElement {
    background-color: transparent !important;
  }
}
</style>
