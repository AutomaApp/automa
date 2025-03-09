<template>
  <div class="logs-table scroll overflow-x-auto">
    <transition-expand>
      <div v-if="state.selected.length > 0" class="border-x border-t px-4 py-2">
        <ui-button @click="stopSelectedWorkflow"> Stop selected </ui-button>
      </div>
    </transition-expand>
    <table class="w-full">
      <tbody class="divide-y dark:divide-gray-800">
        <template v-if="running && running[0]?.state">
          <tr v-for="item in running" :key="item.id" class="border p-2">
            <td v-if="!hideSelect" class="w-8">
              <ui-checkbox
                :model-value="state.selected.includes(item.id)"
                class="align-text-bottom"
                @change="toggleSelectedLog($event, item.id)"
              />
            </td>
            <td class="w-4/12">
              <p
                v-if="modal"
                class="log-link text-overflow"
                @click="$emit('select', { type: 'running', id: item.id })"
              >
                {{ item.state.name }}
              </p>
              <router-link
                v-else
                :to="`/logs/${item.id}/running`"
                class="log-link text-overflow"
              >
                {{ item.state.name }}
              </router-link>
            </td>
            <td
              :title="t('log.duration')"
              class="log-time w-2/12 dark:text-gray-200"
            >
              <v-remixicon name="riTimerLine"></v-remixicon>
              <span>{{
                countDuration(item.state?.startedTimestamp, Date.now())
              }}</span>
            </td>
            <td title="Executing block" class="text-overflow">
              <ui-spinner color="text-accent" size="20" />
              <span class="text-overflow ml-3 inline-block align-middle">
                {{
                  getTranslation(
                    `workflow.blocks.${item.state.currentBlock[0].name}.name`,
                    item.state.currentBlock[0].name
                  )
                }}
              </span>
            </td>
            <td class="text-right">
              <span
                class="inline-block w-16 rounded-md bg-blue-300 py-1 text-center text-sm dark:text-black"
              >
                {{ t('common.running') }}
              </span>
            </td>
            <td class="text-right">
              <ui-button small class="text-sm" @click="stopWorkflow(item.id)">
                {{ t('common.stop') }}
              </ui-button>
            </td>
          </tr>
        </template>
        <tr v-for="log in logs" :key="log.id" class="hoverable">
          <slot name="item-prepend" :log="log" />
          <td
            class="text-overflow w-4/12"
            style="min-width: 140px; max-width: 330px"
          >
            <p
              v-if="modal"
              class="log-link text-overflow"
              @click="$emit('select', { type: 'log', id: log.id })"
            >
              {{ log.name }}
            </p>
            <router-link
              v-else
              :to="`/logs/${log.id}`"
              class="log-link text-overflow"
            >
              {{ log.name }}
            </router-link>
          </td>
          <td
            class="log-time w-3/12 dark:text-gray-200"
            style="min-width: 200px"
          >
            <v-remixicon
              :title="t('log.startedDate')"
              name="riCalendarLine"
              class="mr-2 inline-block align-middle"
            />
            <span :title="formatDate(log.startedAt, 'DD MMM YYYY, hh:mm A')">
              {{ formatDate(log.startedAt, 'relative') }}
            </span>
          </td>
          <td
            :title="t('log.duration')"
            class="log-time w-2/12 dark:text-gray-200"
            style="min-width: 85px"
          >
            <v-remixicon name="riTimerLine"></v-remixicon>
            <span>{{ countDuration(log.startedAt, log.endedAt) }}</span>
          </td>
          <td class="text-right">
            <span
              :class="statusColors[log.status]"
              :title="log.status === 'error' ? getErrorMessage(log) : null"
              class="inline-block w-24 rounded-md py-1 text-center text-sm dark:text-black"
            >
              {{ t(`logStatus.${log.status}`) }}
            </span>
          </td>
          <slot name="item-append" :log="log" />
        </tr>
        <slot name="table:append" />
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { countDuration } from '@/utils/helper';
import dayjs from '@/lib/dayjs';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';

defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
  running: {
    type: Array,
    default: () => [],
  },
  modal: Boolean,
  hideSelect: Boolean,
});
defineEmits(['select']);

const { t, te } = useI18n();

const statusColors = {
  error: 'bg-red-200 dark:bg-red-300',
  success: 'bg-green-200 dark:bg-green-300',
  stopped: 'bg-yellow-200 dark:bg-yellow-300',
};
const state = reactive({
  selected: [],
});

function getTranslation(key, defText = '') {
  return te(key) ? t(key) : defText;
}
function stopWorkflow(stateId) {
  RendererWorkflowService.stopWorkflowExecution(stateId);
}
function toggleSelectedLog(selected, id) {
  if (selected) {
    state.selected.push(id);
    return;
  }

  const index = state.selected.indexOf(id);

  if (index !== -1) state.selected.splice(index, 1);
}
function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function getErrorMessage({ message }) {
  const messagePath = `log.messages.${message}`;

  if (message && te(messagePath)) {
    return t(messagePath);
  }

  return '';
}
function stopSelectedWorkflow() {
  state.selected.forEach((id) => {
    stopWorkflow(id);
  });
  state.selected = [];
}
</script>
<style scoped>
.log-time svg {
  @apply mr-2;
}
.log-time svg,
.log-time span {
  display: inline-block;
  vertical-align: middle;
}

.log-link {
  @apply inline-block w-full align-middle;
  cursor: pointer;
  min-height: 28px;
}
</style>
