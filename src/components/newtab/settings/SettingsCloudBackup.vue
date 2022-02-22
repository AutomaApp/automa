<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg py-4 w-full max-w-3xl">
    <div class="px-4 flex items-center">
      <div class="flex-1 leading-tight">
        <h1 class="text-xl font-semibold">
          {{ t('settings.backupWorkflows.cloud.title') }}
        </h1>
        <p>
          {{
            t(
              `settings.backupWorkflows.cloud.${
                state.activeTab === 'local' ? 'selectText' : 'storedWorkflows'
              }`
            )
          }}
        </p>
      </div>
      <ui-button @click="$emit('close')">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button
        v-if="state.activeTab === 'local'"
        :loading="state.isBackingUp"
        variant="accent"
        class="ml-2"
        @click="backupWorkflowsToCloud"
      >
        {{ t('settings.backupWorkflows.backup.button') }}
      </ui-button>
      <ui-button
        v-else
        :disabled="state.deleteIds.length <= 0"
        :loading="state.isDeletingBackup"
        class="ml-2"
        variant="danger"
        @click="deleteBackup(null)"
      >
        {{ t('settings.backupWorkflows.cloud.delete') }}
        ({{ state.deleteIds.length }})
      </ui-button>
    </div>
    <div class="flex items-center px-4 mt-6">
      <ui-tabs
        v-model="state.activeTab"
        type="fill"
        style="background-color: transparent; padding: 0"
        @change="onTabChange"
      >
        <ui-tab v-for="type in ['local', 'cloud']" :key="type" :value="type">
          {{ t(`settings.backupWorkflows.cloud.buttons.${type}`) }}
        </ui-tab>
      </ui-tabs>
      <div class="flex-grow"></div>
      <ui-input
        v-model="state.query"
        :placeholder="t('common.search')"
        prepend-icon="riSearch2Line"
      />
    </div>
    <ui-tab-panels
      v-model="state.activeTab"
      class="overflow-auto scroll p-1 mt-2 px-4"
      style="height: calc(100vh - 14rem)"
    >
      <ui-tab-panel value="local" class="grid grid-cols-2 gap-2">
        <div
          v-for="workflow in workflows"
          :key="workflow.id"
          :class="{
            'is-selected bg-box-transparent': state.backupIds.includes(
              workflow.id
            ),
          }"
          class="border rounded-lg select-workflow p-4 cursor-pointer leading-tight hoverable flex items-start relative transition"
          @click="toggleSelectWorkflow(workflow.id)"
        >
          <ui-img
            v-if="workflow.icon?.startsWith('http')"
            :src="workflow.icon"
            style="height: 24px; width: 24px"
            alt="Can not display"
          />
          <v-remixicon v-else :name="workflow.icon" />
          <div class="flex-1 ml-2 overflow-hidden">
            <p class="text-overflow">{{ workflow.name }}</p>
            <p class="text-gray-600 dark:text-gray-200 text-overflow">
              {{ workflow.description }}
            </p>
          </div>
          <span
            class="hidden select-icon p-1 rounded-full bg-accent dark:text-black text-gray-100"
          >
            <v-remixicon name="riCheckboxCircleLine" size="20" />
          </span>
        </div>
      </ui-tab-panel>
      <ui-tab-panel value="cloud">
        <div v-if="state.loadingBackup" class="text-center py-4 col-span-2">
          <ui-spinner color="text-accent" />
        </div>
        <template v-else>
          <ui-list class="space-y-1">
            <ui-list-item
              v-for="workflow in backupWorkflows"
              :key="workflow.id"
              :class="{
                'bg-box-transparent': state.deleteIds.includes(workflow.id),
              }"
              class="overflow-hidden"
            >
              <ui-checkbox
                :model-value="state.deleteIds.includes(workflow.id)"
                class="mr-4"
                @change="toggleDeleteWorkflow($event, workflow.id)"
              />
              <ui-img
                v-if="workflow.icon?.startsWith('http')"
                :src="workflow.icon"
                style="height: 24px; width: 24px"
                alt="Can not display"
              />
              <v-remixicon v-else :name="workflow.icon" />
              <p class="text-overflow flex-1 ml-2">{{ workflow.name }}</p>
              <p
                :title="`Last updated: ${formatDate(
                  workflow,
                  'DD MMMM YYYY, hh:mm A'
                )}`"
                class="ml-4 mr-8"
              >
                {{ formatDate(workflow, 'DD MMM YYYY') }}
              </p>
              <button
                v-if="!state.isDeletingBackup"
                :aria-label="t('settings.backupWorkflows.cloud.delete')"
                @click="deleteBackup(workflow.id)"
              >
                <v-remixicon name="riDeleteBin7Line" />
              </button>
            </ui-list-item>
          </ui-list>
        </template>
      </ui-tab-panel>
    </ui-tab-panels>
    <div class="mt-2 flex items-center px-4">
      <button
        v-if="state.activeTab === 'local'"
        class="mr-2 flex items-center"
        @click="selectAll"
      >
        <v-remixicon name="riCheckboxCircleLine" />
        <p class="ml-2">
          {{
            t(
              `settings.backupWorkflows.cloud.${
                state.backupIds.length >= 40 ? 'deselectAll' : 'selectAll'
              }`
            )
          }}
        </p>
      </button>
      <label v-else class="mr-2 flex items-center">
        <ui-checkbox
          :model-value="state.deleteIds.length >= 40"
          @change="selectAllDelIds"
        />
        <p class="ml-2">
          {{
            t(
              `settings.backupWorkflows.cloud.${
                state.deleteIds.length >= 40 ? 'deselectAll' : 'selectAll'
              }`
            )
          }}
        </p>
      </label>
      <div class="flex-grow"></div>
      <p>
        {{
          state.activeTab === 'local'
            ? state.backupIds.length
            : state.cloudWorkflows.length
        }}/40 {{ t('common.workflow', 2) }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { computed, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { fetchApi, cacheApi } from '@/utils/api';
import { convertWorkflow } from '@/utils/workflow-data';
import { parseJSON } from '@/utils/helper';
import dayjs from '@/lib/dayjs';
import Workflow from '@/models/workflow';

defineEmits(['close']);

const { t } = useI18n();
const store = useStore();
const toast = useToast();

const state = reactive({
  query: '',
  deleteIds: [],
  backupIds: [],
  activeTab: 'local',
  cloudWorkflows: [],
  isBackingUp: false,
  loadingBackup: false,
  backupRetrieved: false,
  isDeletingBackup: false,
});

const workflows = computed(() =>
  Workflow.query()
    .where(({ name }) =>
      name.toLocaleLowerCase().includes(state.query.toLowerCase())
    )
    .orderBy('createdAt', 'desc')
    .get()
);
const backupWorkflows = computed(() =>
  state.cloudWorkflows.filter(({ name }) =>
    name.toLocaleLowerCase().includes(state.query.toLowerCase())
  )
);

function formatDate(workflow, format) {
  return dayjs(workflow.updatedAt || Date.now()).format(format);
}
function toggleDeleteWorkflow(value, workflowId) {
  if (value) {
    state.deleteIds.push(workflowId);
  } else {
    const index = state.deleteIds.indexOf(workflowId);

    if (index !== -1) state.deleteIds.splice(index, 1);
  }
}
async function deleteBackup(workflowId) {
  try {
    state.isDeletingBackup = true;

    const ids = workflowId ? [workflowId] : state.deleteIds;
    const response = await fetchApi(
      `/me/workflows?id=${ids.join(',')}&type=backup`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) throw new Error(response.statusText);

    const { backupIds } = await browser.storage.local.get('backupIds');

    ids.forEach((id) => {
      const index = state.cloudWorkflows.findIndex((item) => item.id === id);
      if (index !== -1) state.cloudWorkflows.splice(index, 1);

      const backupIndex = backupIds.indexOf(id);
      if (backupIndex !== -1) backupIds.splice(backupIndex, 1);
    });

    await browser.storage.local.set({ backupIds });

    state.backupIds = backupIds;
    state.isDeletingBackup = false;
    sessionStorage.removeItem('backup-workflows');
  } catch (error) {
    console.error(error);
    state.isDeletingBackup = false;
    toast.error(t('message.somethingWrong'));
    state.isBackingUp = false;
  }
}
async function onTabChange(value) {
  if (value !== 'cloud' || state.backupRetrieved || state.loadingBackup) return;

  state.deleteIds = [];

  try {
    state.loadingBackup = true;
    const data = await cacheApi('backup-workflows', async () => {
      const response = await fetchApi('/me/workflows?type=backup');

      if (!response.ok) throw new Error(response.statusText);

      const result = await response.json();

      return result;
    });

    state.cloudWorkflows = data;
    state.loadingBackup = false;
  } catch (error) {
    console.error(error);
    state.loadingBackup = false;
  }
}
function toggleSelectWorkflow(workflowId) {
  if (state.backupIds.length >= 40) return;

  const index = state.backupIds.indexOf(workflowId);

  if (index !== -1) state.backupIds.splice(index, 1);
  else state.backupIds.push(workflowId);
}
function selectAllDelIds(value) {
  if (value) {
    state.deleteIds = state.cloudWorkflows.map(({ id }) => id);
  } else {
    state.deleteIds = [];
  }
}
function selectAll() {
  let limit = state.backupIds.length;

  if (limit >= 40) {
    state.backupIds = [];
    return;
  }

  Workflow.query()
    .orderBy('createdAt', 'desc')
    .get()
    .forEach(({ id }) => {
      if (limit >= 40 || state.backupIds.includes(id)) return;

      state.backupIds.push(id);

      limit += 1;
    });
}
async function backupWorkflowsToCloud() {
  if (state.isBackingUp) return;

  if (state.backupIds.length === 0) {
    toast.error(t('settings.backupWorkflows.cloud.needSelectWorkflow'), {
      timeout: 7000,
    });

    return;
  }

  try {
    state.isBackingUp = true;

    const workflowsPayload = state.backupIds.reduce((acc, id) => {
      const findWorkflow = Workflow.find(id);

      if (!findWorkflow) return acc;

      const workflow = convertWorkflow(findWorkflow, [
        'dataColumns',
        'id',
        '__id',
      ]);
      delete workflow.extVersion;

      acc.push(workflow);

      return acc;
    }, []);

    const response = await fetchApi('/me/workflows?type=backup', {
      method: 'POST',
      body: JSON.stringify({ workflows: workflowsPayload }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const { lastBackup, data, ids } = await response.json();

    state.isBackingUp = false;
    state.lastBackup = lastBackup;
    state.lastSync = lastBackup;

    const userWorkflows = parseJSON('user-workflows', {
      backup: [],
      hosted: {},
    });
    userWorkflows.backup = data;
    sessionStorage.setItem('user-workflows', JSON.stringify(userWorkflows));

    state.cloudWorkflows = ids.map((id) => Workflow.find(id));

    await Workflow.insertOrUpdate({ data });
    await browser.storage.local.set({
      lastBackup,
      lastSync: lastBackup,
      backupIds: ids,
    });

    sessionStorage.removeItem('backup-workflows');
    sessionStorage.removeItem('user-workflows');
    sessionStorage.removeItem('cache-time:backup-workflows');
  } catch (error) {
    console.error(error);
    toast.error(t('message.somethingWrong'));
    state.isBackingUp = false;
  }
}

watch(
  () => store.state.userDataRetrieved,
  async () => {
    const { backupIds } = await browser.storage.local.get('backupIds');

    state.backupIds = backupIds || [];
  },
  { immediate: true }
);
</script>
<style scoped>
.select-workflow.is-selected .select-icon {
  display: block;
}
</style>
