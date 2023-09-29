<template>
  <ui-card
    v-if="workflowState?.state"
    class="shadow-xl flex items-start fixed bottom-8 z-50 left-1/2 -translate-x-1/2"
  >
    <div class="mr-4 w-52">
      <div class="flex items-center gap-2">
        <ui-button
          :disabled="workflowState.state.nextBlockBreakpoint"
          variant="accent"
          class="flex-1"
          @click="toggleExecution"
        >
          <v-remixicon
            :name="
              workflowState.status === 'breakpoint'
                ? 'riPlayLine'
                : 'riPauseLine'
            "
            class="mr-2 -ml-1"
          />
          <span>
            {{
              t(
                `common.${
                  workflowState.status === 'breakpoint' ? 'resume' : 'pause'
                }`
              )
            }}
          </span>
        </ui-button>
        <ui-button
          v-tooltip="t('workflow.testing.nextBlock')"
          :disabled="workflowState.status !== 'breakpoint'"
          icon
          @click="nextBlock"
        >
          <v-remixicon name="riArrowLeftSLine" rotate="180" />
        </ui-button>
        <ui-button
          v-tooltip="t('common.stop')"
          icon
          class="text-red-500 dark:text-red-600"
          @click="stopWorkflow"
        >
          <v-remixicon name="riStopLine" />
        </ui-button>
      </div>
      <ui-list
        v-if="workflowState.state"
        class="mt-4 overflow-auto h-[105px] scroll"
      >
        <ui-list-item
          v-for="block in workflowState.state.currentBlock"
          :key="block.id"
          small
        >
          <div class="text-overflow text-sm w-full">
            <div class="flex items-center">
              <p class="flex-1 text-overflow">
                {{ getBlockName(block.name) }}
              </p>
              <v-remixicon
                title="Go to block"
                name="riEyeLine"
                size="18"
                class="text-gray-600 dark:text-gray-200 cursor-pointer"
                @click="$emit('goToBlock', block.id)"
              />
            </div>
            <p
              class="leading-tight text-overflow text-gray-600 dark:text-gray-200"
            >
              {{ t('workflow.testing.startRun') }}:
              {{ dayjs(block.startedAt).format('HH:mm:ss, SSS') }}
            </p>
          </div>
        </ui-list-item>
      </ui-list>
    </div>
    <div class="w-64">
      <ui-tabs v-model="activeTab" class="-mt-1">
        <ui-tab class="!py-2" value="workflow-data">Data</ui-tab>
        <ui-tab class="!py-2" value="workflow-logs">Logs</ui-tab>
      </ui-tabs>
      <ui-tab-panels v-model="activeTab">
        <ui-tab-panel value="workflow-data">
          <shared-codemirror
            :model-value="JSON.stringify(workflowData, null, 2)"
            :line-numbers="false"
            hide-lang
            readonly
            lang="json"
            class="h-40 scroll breakpoint-data"
          />
        </ui-tab-panel>
        <ui-tab-panel
          ref="workflowLogsContainer"
          value="workflow-logs"
          class="h-40 scroll text-sm overflow-auto"
        >
          <ui-list class="mt-2">
            <ui-list-item
              v-for="item in (workflowState?.state?.logs ?? [])
                .slice(-100)
                .reverse()"
              :key="item.id"
              small
              class="!block"
            >
              <div class="flex items-center gap-2 overflow-hidden w-full">
                <p class="flex-1 text-overflow leading-tight">
                  {{ getBlockName(item.name) }}
                </p>
                <p
                  class="text-gray-600 leading-tight dark:text-gray-300 tabular-nums"
                  :title="t('log.duration')"
                >
                  {{ item.duration }}s
                </p>
              </div>
              <p class="flex-1 text-gray-600 leading-tight dark:text-gray-300">
                {{ item.description }}
              </p>
            </ui-list-item>
          </ui-list>
        </ui-tab-panel>
      </ui-tab-panels>
    </div>
  </ui-card>
</template>
<script setup>
import { defineAsyncComponent, computed, watch, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from '@/lib/dayjs';
import { tasks } from '@/utils/shared';
import { debounce } from '@/utils/helper';
import { sendMessage } from '@/utils/message';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  states: {
    type: Array,
    default: () => [],
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['goToBlock']);

let currentRunningEls = [];

const { t, te } = useI18n();

const activeTab = shallowRef('workflow-data');

const workflowState = computed(() => props.states[0]);
const workflowData = computed(() => {
  if (!workflowState.value?.state?.ctxData) return {};
  const { ctxData, dataSnapshot } = workflowState.value.state.ctxData;
  const latestData = Object.values(ctxData).at(-1);
  if (!latestData) return {};

  return {
    ...latestData,
    referenceData: {
      ...latestData.referenceData,
      loopData: dataSnapshot[latestData.referenceData.loopData] ?? {},
      variables: dataSnapshot[latestData.referenceData.variables] ?? {},
    },
  };
});

function getBlockName(blockId) {
  const key = `workflow.blocks.${blockId}.name`;

  return te(key) ? t(key) : tasks[blockId].name;
}
function toggleExecution() {
  if (!workflowState.value) return;

  if (workflowState.value.status === 'running') {
    sendMessage('workflow:breakpoint', workflowState.value.id, 'background');
  } else {
    sendMessage(
      'workflow:resume',
      { id: workflowState.value.id },
      'background'
    );
  }
}
function stopWorkflow() {
  if (!workflowState.value) return;

  sendMessage('workflow:stop', workflowState.value.id, 'background');
}
function nextBlock() {
  sendMessage(
    'workflow:resume',
    { id: workflowState.value.id, nextBlock: true },
    'background'
  );
}

watch(
  workflowState,
  debounce(() => {
    currentRunningEls.forEach((element) => {
      element.classList.remove('current-running');
    });

    if (!workflowState.value?.state?.currentBlock) return;

    const selectors = workflowState.value.state.currentBlock
      .map((block) => `.vue-flow [data-block-id="${block.id}"]`)
      .join(',');
    const elements = document.querySelectorAll(selectors);

    currentRunningEls = elements;
    elements.forEach((el) => {
      el.classList.add('current-running');
    });
  }, 200),
  { immediate: true }
);
</script>
<style>
.breakpoint-data .cm-editor {
  font-size: 13px;
  padding-bottom: 0;
}

.current-running {
  @apply ring;
}
</style>
