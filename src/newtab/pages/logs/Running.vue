<template>
  <div v-if="running" class="container py-8">
    <div class="flex items-center">
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
        :current-log="{
          history: running.state.logs,
          workflowId: running.workflowId,
        }"
      >
        <template #prepend>
          <div class="mb-4">
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
              :to="`/workflows/${running.workflowId}?block=${block.id}`"
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
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { countDuration } from '@/utils/helper';
import { sendMessage } from '@/utils/message';
import dayjs from '@/lib/dayjs';
import LogsHistory from '@/components/newtab/logs/LogsHistory.vue';

const { t } = useI18n();
const store = useStore();
const route = useRoute();
const router = useRouter();

const key = shallowRef(0);
const interval = setInterval(() => {
  key.value += 1;
}, 1000);

const running = computed(() =>
  store.state.workflowState.find(({ id }) => id === route.params.id)
);

function stopWorkflow() {
  sendMessage('workflow:stop', running.value.id, 'background');
}

watch(
  running,
  () => {
    if (!running.value && route.params.id) {
      router.replace('/logs');
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>
