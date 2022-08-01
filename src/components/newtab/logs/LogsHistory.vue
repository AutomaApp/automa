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
  <div
    class="p-4 rounded-lg bg-gray-900 dark:bg-gray-800 text-gray-100 dark scroll overflow-auto"
    style="max-height: 600px"
  >
    <slot name="prepend" />
    <div class="text-sm font-mono space-y-1 w-full overflow-auto">
      <ui-expand
        v-for="(item, index) in history"
        :key="item.id || index"
        :disabled="!ctxData[item.id]"
        hide-header-icon
        class="hoverable rounded-md"
        active-class="bg-box-transparent"
        header-class="px-2 w-full text-left focus:ring-0 py-1 rounded-md group cursor-default flex items-start"
        @click="state.itemId = item.id"
      >
        <template #header="{ show }">
          <span class="w-6">
            <v-remixicon
              v-show="ctxData[item.id]"
              :rotate="show ? 270 : 180"
              size="20"
              name="riArrowLeftSLine"
              class="transition-transform text-gray-400 -ml-1 mr-2"
            />
          </span>
          <span
            :title="`${t('log.duration')}: ${Math.round(
              item.duration / 1000
            )}s`"
            class="w-14 flex-shrink-0 text-overflow text-gray-400"
          >
            {{ countDuration(0, item.duration || 0) }}
          </span>
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
        </template>
        <pre
          class="px-2 pb-2 text-gray-300 overflow-auto text-sm ml-6 scroll max-h-96"
          >{{ ctxData[state.itemId] || 'EMPTY' }}</pre
        >
      </ui-expand>
      <slot name="append-items" />
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

const { t, te } = useI18n();

const state = shallowReactive({
  itemId: '',
});
const pagination = shallowReactive({
  perPage: 25,
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
function getBlockPath(blockId) {
  const { workflowId, teamId } = props.currentLog;
  let path = `/workflows/${workflowId}`;

  if (workflowId.startsWith('team') && teamId) {
    path = `/teams/${teamId}/workflows/${workflowId}`;
  }

  return `${path}?blockId=${blockId}`;
}
</script>
