<template>
  <div v-if="running">
    <div class="flex items-center">
      <button
        v-tooltip:bottom="t('workflow.blocks.go-back.name')"
        role="button"
        class="h-12 px-1 transition mr-2 bg-input rounded-lg dark:text-gray-300 text-gray-600"
        @click="$emit('close')"
      >
        <v-remixicon name="riArrowLeftSLine" />
      </button>
      <div class="flex-grow overflow-hidden">
        <h1 class="text-2xl max-w-md text-overflow font-semibold text-overflow">
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
            class="px-2 py-1 rounded-md w-full group hoverable flex items-center"
          >
            <span
              :key="key"
              :title="`Duration: ${Math.round(
                (Date.now() - block.startedAt) / 1000
              )}s`"
              class="w-14 flex-shrink-0 text-overflow text-gray-400 ml-6"
            >
              {{ countDuration(block.startedAt, Date.now()) }}
            </span>
            <ui-spinner size="16" class="mr-2" color="text-accent" />
            <p class="flex-1">
              {{ t(`workflow.blocks.${block.name}.name`) }}
            </p>
            <router-link
              v-if="getBlockPath(block.id)"
              :to="getBlockPath(block.id)"
              title="Go to block"
              class="invisible group-hover:visible"
            >
              <v-remixicon
                name="riExternalLinkLine"
                size="20"
                title="Go to block"
                class="text-gray-300 cursor-pointer ml-2 invisible group-hover:visible"
              />
            </router-link>
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
import { stopWorkflowExec } from '@/workflowEngine';
import dbLogs from '@/db/logs';
import dayjs from '@/lib/dayjs';
import LogsHistory from '@/components/newtab/logs/LogsHistory.vue';

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
  stopWorkflowExec(running.value.id);
  emit('close');
}
function getBlockPath(blockId) {
  const { workflowId, teamId } = running.value;
  let path = `/workflows/${workflowId}`;

  if (workflowId.startsWith('team') && !teamId) return null;

  path = `/teams/${teamId}/workflows/${workflowId}`;

  return `${path}?blockId=${blockId}`;
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
