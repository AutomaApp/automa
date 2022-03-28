<template>
  <div class="container pt-8 pb-4">
    <div class="flex items-center mb-8">
      <div>
        <h1 class="text-2xl max-w-md text-overflow font-semibold">
          {{ activeLog.name }}
        </h1>
        <p class="text-gray-600 dark:text-gray-200">
          {{
            t(`log.description.text`, {
              status: t(`log.description.status.${activeLog.status}`),
              date: dayjs(activeLog.startedAt).format('DD MMM'),
              duration: countDuration(activeLog.startedAt, activeLog.endedAt),
            })
          }}
        </p>
      </div>
      <div class="flex-grow"></div>
      <ui-button class="text-red-500 dark:text-red-400" @click="deleteLog">
        {{ t('common.delete') }}
      </ui-button>
    </div>
    <div class="flex items-start">
      <div class="w-7/12 mr-6">
        <ui-list>
          <router-link
            v-if="collectionLog"
            :to="activeLog.parentLog?.id || activeLog.collectionLogId"
            replace
            class="mb-4 flex"
          >
            <v-remixicon name="riArrowLeftLine" class="mr-2" />
            {{ t('log.goBack', { name: collectionLog.name }) }}
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
          v-if="activeLog.history.length >= 10"
          class="flex items-center justify-between mt-4"
        >
          <div>
            {{ t('components.pagination.text1') }}
            <select
              v-model="pagination.perPage"
              class="p-1 rounded-md bg-input"
            >
              <option
                v-for="num in [10, 15, 25, 50, 100]"
                :key="num"
                :value="num"
              >
                {{ num }}
              </option>
            </select>
            {{
              t('components.pagination.text2', {
                count: activeLog.history.length,
              })
            }}
          </div>
          <ui-pagination
            v-model="pagination.currentPage"
            :per-page="pagination.perPage"
            :records="activeLog.history.length"
          />
        </div>
      </div>
      <div class="w-5/12 logs-details sticky top-10">
        <logs-data-viewer :log="activeLog" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, shallowReactive, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import Log from '@/models/log';
import dayjs from '@/lib/dayjs';
import { countDuration } from '@/utils/helper';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';

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
const route = useRoute();
const router = useRouter();

const ctxData = shallowRef({});
const pagination = shallowReactive({
  perPage: 10,
  currentPage: 1,
});

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

const activeLog = computed(() => Log.find(route.params.id));
const history = computed(() =>
  activeLog.value.history
    .slice(
      (pagination.currentPage - 1) * pagination.perPage,
      pagination.currentPage * pagination.perPage
    )
    .map(translateLog)
);

const collectionLog = computed(() => {
  if (activeLog.value.parentLog) {
    return Log.find(activeLog.value.parentLog.id);
  }

  return Log.find(activeLog.value.collectionLogId);
});

function deleteLog() {
  Log.delete(route.params.id).then(() => {
    router.replace('/logs');
  });
}

onMounted(async () => {
  if (!activeLog.value) router.replace('/logs');

  const { logsCtxData } = await browser.storage.local.get('logsCtxData');
  const logCtxData = logsCtxData && logsCtxData[route.params.id];
  if (logCtxData) {
    ctxData.value = logCtxData;
  }
});
</script>
<style>
.logs-details .cm-editor {
  max-height: calc(100vh - 15rem);
}
</style>
