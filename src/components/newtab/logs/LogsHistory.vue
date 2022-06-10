<template>
  <ui-list class="w-full">
    <router-link
      v-if="parentLog"
      :to="currentLog.parentLog?.id || currentLog.collectionLogId"
      class="mb-4 flex"
    >
      <v-remixicon name="riArrowLeftLine" class="mr-2" />
      {{ t('log.goBack', { name: parentLog.name }) }}
    </router-link>
    <ui-expand
      v-for="(item, index) in history"
      :key="item.id || index"
      hide-header-icon
      class="mb-1"
      header-active-class="bg-box-transparent rounded-b-none"
      header-class="flex items-center px-4 py-2 hoverable rounded-lg w-full text-left history-item focus:ring-0"
    >
      <template #header="{ show }">
        <v-remixicon
          :rotate="show ? 270 : 180"
          size="20"
          name="riArrowLeftSLine"
          class="transition-transform dark:text-gray-200 text-gray-600 -ml-1 mr-2"
        />
        <span
          :class="logsType[item.type]?.color"
          class="p-1 rounded-lg align-middle inline-block mr-2 dark:text-black"
        >
          <v-remixicon :name="logsType[item.type]?.icon" size="20" />
        </span>
        <div class="flex-1 line-clamp pr-2">
          <p class="w-full text-overflow leading-tight">
            {{ item.name }}
            <span
              v-show="item.description"
              :title="item.description"
              class="text-overflow text-gray-600 dark:text-gray-200 text-sm"
            >
              ({{ item.description }})
            </span>
          </p>
          <p
            v-if="item.message"
            :title="item.message"
            class="text-sm line-clamp text-gray-600 dark:text-gray-200"
          >
            {{ item.message }}
          </p>
        </div>
        <router-link
          v-if="item.logId"
          :to="'/logs/' + item.logId"
          class="mr-4"
          title="Open log detail"
        >
          <v-remixicon name="riExternalLinkLine" />
        </router-link>
        <code
          v-show="item.workerId"
          :title="t('log.flowId')"
          class="text-xs mr-4 bg-box-transparent rounded-lg p-1 rounded-md"
        >
          {{ item.workerId }}
        </code>
        <p class="text-gray-600 dark:text-gray-200">
          {{ countDuration(0, item.duration || 0) }}
        </p>
      </template>
      <pre
        class="text-sm px-4 max-h-52 overflow-auto scroll bg-box-transparent pb-2 rounded-b-lg"
        >{{ ctxData[item.id] }}</pre
      >
    </ui-expand>
  </ui-list>
  <div
    v-if="currentLog.history.length >= 10"
    class="flex items-center justify-between mt-4"
  >
    <div>
      {{ t('components.pagination.text1') }}
      <select v-model="pagination.perPage" class="p-1 rounded-md bg-input">
        <option v-for="num in [10, 15, 25, 50, 100]" :key="num" :value="num">
          {{ num }}
        </option>
      </select>
      {{
        t('components.pagination.text2', {
          count: currentLog.history.length,
        })
      }}
    </div>
    <ui-pagination
      v-model="pagination.currentPage"
      :per-page="pagination.perPage"
      :records="currentLog.history.length"
    />
  </div>
</template>
<script setup>
/* eslint-disable no-use-before-define */
import { computed, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { countDuration } from '@/utils/helper';

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
    color: 'bg-green-200 dark:bg-green-300',
    icon: 'riCheckLine',
  },
  stop: {
    color: 'bg-yellow-200 dark:bg-yellow-300',
    icon: 'riStopLine',
  },
  stopped: {
    color: 'bg-yellow-200 dark:bg-yellow-300',
    icon: 'riStopLine',
  },
  error: {
    color: 'bg-red-200 dark:bg-red-300',
    icon: 'riErrorWarningLine',
  },
  finish: {
    color: 'bg-blue-200 dark:bg-blue-300',
    icon: 'riFlagLine',
  },
};

const { t, te } = useI18n();

const pagination = shallowReactive({
  perPage: 10,
  currentPage: 1,
});

const history = computed(() =>
  props.currentLog.history
    .slice(
      (pagination.currentPage - 1) * pagination.perPage,
      pagination.currentPage * pagination.perPage
    )
    .map(translateLog)
);

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
      log.name
    );
  }

  copyLog.message = getTranslatation(
    { path: `log.messages.${log.message}`, params: log },
    log.message
  );

  return copyLog;
}
</script>
