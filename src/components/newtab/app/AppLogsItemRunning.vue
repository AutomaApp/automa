<template>
  <div v-if="running">
    <div class="flex items-center">
      <button
        v-tooltip:bottom="t('workflow.blocks.go-back.name')"
        role="button"
        class="bg-input mr-2 h-12 rounded-lg px-1 text-gray-600 transition dark:text-gray-300"
        @click="$emit('close')"
      >
        <v-remixicon name="riArrowLeftSLine" />
      </button>
      <div class="grow overflow-hidden">
        <h1 class="text-overflow max-w-md text-2xl font-semibold">
          {{ running.state.name }}
        </h1>
        <p>
          {{
            t('running.start', {
              date: dayjs(running.state.startedTimestamp).format(
                'DD MMM, hh:mm A'
              ),
            })
          }}
        </p>
      </div>
      <ui-button @click="stopWorkflow">
        {{ t('common.stop') }}
      </ui-button>
    </div>
    <div class="mt-8">
      <logs-history
        :is-running="true"
        :current-log="{
          history: running.state.logs,
          workflowId: running.workflowId,
        }"
      >
        <template #header-prepend>
          <div>
            <h3 class="leading-tight">
              {{ t('common.log', 2) }}
            </h3>
            <p class="leading-tight text-gray-600 dark:text-gray-300">
              {{ t('running.message') }}
            </p>
          </div>
        </template>
        <template #append-items>
          <div
            v-for="block in running.state.currentBlock"
            :key="block.id"
            class="hoverable group flex w-full items-center rounded-md px-2 py-1"
          >
            <span
              :key="key"
              :title="`Duration: ${Math.round(
                (Date.now() - block.startedAt) / 1000
              )}s`"
              class="text-overflow ml-6 w-14 shrink-0 text-gray-400"
            >
              {{ countDuration(block.startedAt, Date.now()) }}
            </span>
            <ui-spinner size="16" class="mr-2" color="text-accent" />
            <p class="flex-1">
              {{ t(`workflow.blocks.${block.name}.name`) }}
            </p>
          </div>
        </template>
      </logs-history>
    </div>
  </div>
</template>
<script setup>
import { computed, watch, shallowRef, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { countDuration } from '@/utils/helper';
import { useWorkflowStore } from '@/stores/workflow';
import dbLogs from '@/db/logs';
import dayjs from '@/lib/dayjs';
import LogsHistory from '@/components/newtab/logs/LogsHistory.vue';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';

const props = defineProps({
  logId: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['close']);

const { t } = useI18n();
const router = useRouter();
const workflowStore = useWorkflowStore();

const key = shallowRef(0);
const interval = setInterval(() => {
  key.value += 1;
}, 1000);

const running = computed(() =>
  workflowStore.getAllStates.find(({ id }) => id === props.logId)
);

function stopWorkflow() {
  RendererWorkflowService.stopWorkflowExecution(running.value.id);
  emit('close');
}

watch(
  running,
  async () => {
    if (!running.value && props.logId) {
      const log = await dbLogs.items.where('id').equals(props.logId).first();
      let path = '/logs';

      if (log) {
        path = `/logs/${props.logId}`;
      }

      router.replace(path);
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>
