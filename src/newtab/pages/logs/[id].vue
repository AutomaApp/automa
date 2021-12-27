<template>
  <div class="container pt-8 pb-4">
    <div class="flex items-center mb-8">
      <div>
        <h1 class="text-2xl max-w-md text-overflow font-semibold">
          {{ activeLog.name }}
        </h1>
        <p class="text-gray-600">
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
      <ui-button class="text-red-500" @click="deleteLog">
        {{ t('common.delete') }}
      </ui-button>
    </div>
    <div class="flex items-start">
      <div class="w-7/12 mr-6">
        <ui-list>
          <router-link
            v-if="collectionLog"
            :to="activeLog.collectionLogId"
            replace
            class="mb-4 flex"
          >
            <v-remixicon name="riArrowLeftLine" class="mr-2" />
            {{ t('log.goBack', { name: collectionLog.name }) }}
          </router-link>
          <ui-list-item v-for="(item, index) in history" :key="index">
            <span
              :class="logsType[item.type]?.color"
              class="p-1 rounded-lg align-middle inline-block mr-2"
            >
              <v-remixicon :name="logsType[item.type]?.icon" size="20" />
            </span>
            <div class="flex-1 text-overflow pr-2">
              <p class="w-full text-overflow leading-tight">
                {{ item.name }}
              </p>
              <p
                v-if="item.message"
                :title="item.message"
                class="
                  text-sm
                  leading-tight
                  text-overflow text-gray-600
                  dark:text-gray-200
                "
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
            <p class="text-gray-600">
              {{ countDuration(0, item.duration || 0) }}
            </p>
          </ui-list-item>
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
import { computed, onMounted, shallowReactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Log from '@/models/log';
import dayjs from '@/lib/dayjs';
import { countDuration } from '@/utils/helper';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';

const logsType = {
  success: {
    color: 'bg-green-200',
    icon: 'riCheckLine',
  },
  stop: {
    color: 'bg-yellow-200',
    icon: 'riStopLine',
  },
  stopped: {
    color: 'bg-yellow-200',
    icon: 'riStopLine',
  },
  error: {
    color: 'bg-red-200',
    icon: 'riErrorWarningLine',
  },
  finish: {
    color: 'bg-blue-200',
    icon: 'riFlagLine',
  },
};

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();

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
    ''
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
const collectionLog = computed(() => Log.find(activeLog.value.collectionLogId));

function deleteLog() {
  Log.delete(route.params.id).then(() => {
    router.replace('/logs');
  });
}

onMounted(() => {
  if (!activeLog.value) router.replace('/logs');
});
</script>
<style>
.logs-details .cm-editor {
  max-height: calc(100vh - 12rem);
}
</style>
