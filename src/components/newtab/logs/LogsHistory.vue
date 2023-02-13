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
  <div class="flex flex-col-reverse items-start lg:flex-row">
    <div class="w-full lg:w-auto lg:flex-1">
      <div class="dark rounded-lg bg-gray-900 text-gray-100">
        <div class="mb-4 flex items-center border-b p-4 text-gray-200">
          <div v-if="currentLog.status === 'error' && errorBlock">
            <p class="line-clamp leading-tight">
              {{ errorBlock.message }}
              <a
                v-if="errorBlock.messageId"
                :href="`https://docs.automa.site/reference/workflow-common-errors.html#${errorBlock.messageId}`"
                target="_blank"
                title="About the error"
                @click.stop
              >
                <v-remixicon
                  name="riArrowLeftLine"
                  size="20"
                  class="inline-block text-gray-300"
                  rotate="135"
                />
              </a>
            </p>
            <p class="cursor-pointer" title="Jump to item" @click="jumpToError">
              On the {{ errorBlock.name }} block
              <v-remixicon
                name="riArrowLeftLine"
                class="-ml-1 inline-block"
                size="18"
                rotate="135"
              />
            </p>
          </div>
          <slot name="header-prepend" />
          <div class="grow" />
          <ui-popover v-if="!isRunning" trigger-width class="mr-4">
            <template #trigger>
              <ui-button>
                <span>
                  Export <span class="hidden lg:inline-block">logs</span>
                </span>
                <v-remixicon name="riArrowDropDownLine" class="ml-2 -mr-1" />
              </ui-button>
            </template>
            <ui-list class="space-y-1">
              <ui-list-item
                v-for="type in dataExportTypes"
                :key="type.id"
                v-close-popover
                class="cursor-pointer"
                @click="exportLogs(type.id)"
              >
                {{ t(`log.exportData.types.${type.id}`) }}
              </ui-list-item>
            </ui-list>
          </ui-popover>
          <ui-input
            v-if="!isRunning"
            v-model="state.search"
            :placeholder="t('common.search')"
            prepend-icon="riSearch2Line"
          />
        </div>
        <div
          id="log-history"
          style="max-height: 500px"
          class="scroll overflow-auto p-4"
        >
          <slot name="prepend" />
          <p
            v-if="currentLog.history.length === 0"
            class="text-center text-gray-300"
          >
            The workflow log is not saved
          </p>
          <div class="w-full space-y-1 overflow-auto font-mono text-sm">
            <div
              v-for="(item, index) in history"
              :key="item.id || index"
              :disabled="!ctxData[item.id]"
              :class="{ 'bg-box-transparent': item.id === state.itemId }"
              hide-header-icon
              class="hoverable group flex w-full cursor-default items-start rounded-md px-2 py-1 text-left focus:ring-0"
              @click="setActiveLog(item)"
            >
              <div
                style="min-width: 54px"
                class="text-overflow mr-4 shrink-0 text-gray-400"
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
                class="text-overflow w-2/12 shrink-0"
              >
                <v-remixicon
                  :name="logsType[item.type]?.icon"
                  size="18"
                  class="-mr-1 inline-block align-text-top"
                />
                {{ item.name }}
              </span>
              <span
                :title="`${t('common.description')} (${item.description})`"
                class="text-overflow ml-2 w-2/12 shrink-0"
              >
                {{ item.description }}
              </span>
              <p
                :title="item.message"
                class="line-clamp ml-2 flex-1 text-sm leading-tight text-gray-600 dark:text-gray-200"
              >
                {{ item.message }}
                <a
                  v-if="item.messageId"
                  :href="`https://docs.automa.site/reference/workflow-common-errors.html#${item.messageId}`"
                  target="_blank"
                  title="About the error"
                  @click.stop
                >
                  <v-remixicon
                    name="riArrowLeftLine"
                    size="20"
                    class="inline-block text-gray-300"
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
                  class="ml-2 cursor-pointer text-gray-300"
                  size="20"
                  name="riFileTextLine"
                  @click.stop="navigate"
                />
              </router-link>
              <router-link
                v-if="!isRunning && getBlockPath(item.blockId)"
                v-show="currentLog.workflowId && item.blockId"
                :to="getBlockPath(item.blockId)"
              >
                <v-remixicon
                  name="riExternalLinkLine"
                  size="20"
                  title="Go to block"
                  class="invisible ml-2 cursor-pointer text-gray-300 group-hover:visible"
                />
              </router-link>
            </div>
            <slot name="append-items" />
          </div>
        </div>
      </div>
      <div
        v-if="currentLog.history.length >= 25"
        class="mt-4 lg:flex lg:items-center lg:justify-between"
      >
        <div class="mb-4 lg:mb-0">
          {{ t('components.pagination.text1') }}
          <select v-model="pagination.perPage" class="bg-input rounded-md p-1">
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
      class="dark mb-4 w-full rounded-lg bg-gray-900 text-gray-100 lg:ml-8 lg:mb-0 lg:w-4/12"
    >
      <div class="relative p-4">
        <v-remixicon
          name="riCloseLine"
          class="absolute top-2 right-2 cursor-pointer text-gray-500"
          @click="clearActiveItem"
        />
        <table class="ctx-data-table w-full">
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
      <div class="flex items-center px-4 pb-4">
        <p>Log data</p>
        <div class="grow" />
        <ui-select v-model="state.activeTab">
          <option v-for="option in tabs" :key="option.id" :value="option.id">
            {{ option.name }}
          </option>
        </ui-select>
      </div>
      <div class="log-data-prev px-2 pb-4">
        <shared-codemirror
          :model-value="logCtxData"
          readonly
          hide-lang
          lang="json"
          style="max-height: 460px"
          class="scroll"
        />
      </div>
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
import Papa from 'papaparse';
import objectPath from 'object-path';
import { countDuration, fileSaver } from '@/utils/helper';
import { getBlocks } from '@/utils/getSharedData';
import { dataExportTypes, messageHasReferences } from '@/utils/shared';
import dayjs from '@/lib/dayjs';

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
  isRunning: Boolean,
});

const files = {
  'plain-text': {
    mime: 'text/plain',
    ext: '.txt',
  },
  json: {
    mime: 'application/json',
    ext: '.json',
  },
  csv: {
    mime: 'text/csv',
    ext: '.csv',
  },
};
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
  let logData = props.ctxData;
  if (logData.ctxData) logData = logData.ctxData;

  if (!state.itemId || !logData[state.itemId]) return '';

  const data = logData[state.itemId];
  /* eslint-disable-next-line */
  if (data?.referenceData) getDataSnapshot(data.referenceData);
  const itemLogData =
    state.activeTab === 'all' ? data : objectPath.get(data, state.activeTab);

  return JSON.stringify(itemLogData, null, 2);
});

function getDataSnapshot(refData) {
  if (!props.ctxData?.dataSnapshot) return;

  const data = props.ctxData.dataSnapshot;
  const getData = (key) => {
    const currentData = refData[key];
    if (typeof currentData !== 'string') return currentData;

    return data[currentData] ?? {};
  };

  refData.loopData = getData('loopData');
  refData.variables = getData('variables');
}
function exportLogs(type) {
  let data = type === 'plain-text' ? '' : [];
  const getItemData = {
    'plain-text': ([
      timestamp,
      status,
      name,
      description,
      message,
      ctxData,
    ]) => {
      data += `${timestamp} - ${status} - ${name} - ${description} - ${message} - ${JSON.stringify(
        ctxData
      )} \n`;
    },
    json: ([timestamp, status, name, description, message, ctxData]) => {
      data.push({
        timestamp,
        status,
        name,
        description,
        message,
        data: ctxData,
      });
    },
    csv: (item, index) => {
      if (index === 0) {
        data.unshift([
          'timestamp',
          'status',
          'name',
          'description',
          'message',
          'data',
        ]);
      }

      item[item.length - 1] = JSON.stringify(item[item.length - 1]);

      data.push(item);
    },
  };
  translatedLog.value.forEach((item, index) => {
    let logData = props.ctxData;
    if (logData.ctxData) logData = logData.ctxData;

    const itemData = logData[item.id] || null;
    if (itemData) getDataSnapshot(itemData.referenceData);

    getItemData[type](
      [
        dayjs(item.timestamp || Date.now()).format('DD-MM-YYYY, hh:mm:ss'),
        item.type.toUpperCase(),
        item.name,
        item.description || 'NULL',
        item.message || 'NULL',
        itemData,
      ],
      index
    );
  });

  switch (type) {
    case 'plain-text':
      data = [data];
      break;
    case 'csv':
      data = [Papa.unparse(data)];
      data.unshift(new Uint8Array([0xef, 0xbb, 0xbf]));
      break;
    case 'json':
      data = [JSON.stringify(data, null, 2)];
      break;
    default:
  }

  const { mime, ext } = files[type];
  const blobUrl = URL.createObjectURL(new Blob(data, { type: mime }));
  const filename = `[${dayjs().format('DD-MM-YYYY, HH:mm:ss')}] ${
    props.currentLog.name
  } - logs`;

  fileSaver(`${filename}${ext}`, blobUrl);

  URL.revokeObjectURL(blobUrl);
}
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
