<template>
  <div class="flex items-start mt-4 cloud-backup">
    <div class="w-56">
      <ui-input
        v-model="state.query"
        :placeholder="t('common.search')"
        autocomplete="off"
        prepend-icon="riSearch2Line"
      />
      <ui-list class="mt-4">
        <p class="mb-1 text-sm text-gray-600 dark:text-gray-200">Location</p>
        <ui-list-item
          v-for="location in ['local', 'cloud']"
          :key="location"
          :active="location === state.activeTab"
          :disabled="backupState.uploading || backupState.deleting"
          color="bg-box-transparent"
          class="mb-1 cursor-pointer"
          @click="state.activeTab = location"
        >
          {{ t(`settings.backupWorkflows.cloud.buttons.${location}`) }}
          <span
            v-if="location === 'cloud'"
            class="ml-2 text-sm rounded-full bg-accent dark:text-black text-gray-100 text-center"
            style="height: 29px; width: 29px; line-height: 29px"
          >
            {{ state.cloudWorkflows.length }}
          </span>
        </ui-list-item>
      </ui-list>
      <ui-button
        v-if="state.selectedWorkflows.length > 0 && state.activeTab === 'local'"
        :loading="backupState.uploading"
        variant="accent"
        class="mt-4 w-8/12"
        @click="backupWorkflowsToCloud()"
      >
        {{ t('settings.backupWorkflows.backup.button') }}
        ({{ state.selectedWorkflows.length }})
      </ui-button>
      <ui-button
        v-if="state.deleteIds.length > 0 && state.activeTab === 'cloud'"
        :loading="backupState.deleting"
        variant="danger"
        class="mt-4"
        @click="deleteBackup()"
      >
        {{ t('settings.backupWorkflows.cloud.delete') }}
        ({{ state.deleteIds.length }})
      </ui-button>
    </div>
    <div v-if="!state.backupRetrieved" class="text-center block flex-1 content">
      <ui-spinner color="text-accent" />
    </div>
    <div v-else class="flex-1 ml-4 overflow-hidden">
      <template v-if="state.activeTab === 'cloud'">
        <settings-backup-items
          v-slot="{ workflow }"
          v-model="state.deleteIds"
          :workflows="backupWorkflows"
          :limit="state.cloudWorkflows.length"
          :query="state.query"
          @select="selectAllCloud"
        >
          <p
            :title="`Last updated: ${formatDate(
              workflow,
              'DD MMMM YYYY, hh:mm A'
            )}`"
            class="ml-4 mr-8"
          >
            {{ formatDate(workflow, 'DD MMM YYYY') }}
          </p>
          <ui-spinner
            v-if="backupState.workflowId === workflow.id"
            color="text-accent"
            class="ml-4"
          />
          <button
            v-else-if="!backupState.deleting"
            class="ml-4 invisible group-hover:visible"
            :aria-label="t('settings.backupWorkflows.cloud.delete')"
            @click="deleteBackup(workflow.id)"
          >
            <v-remixicon name="riDeleteBin7Line" />
          </button>
        </settings-backup-items>
      </template>
      <template v-else>
        <settings-backup-items
          v-slot="{ workflow }"
          v-model="state.selectedWorkflows"
          :workflows="workflows"
          :limit="workflowLimit"
          :query="state.query"
          @select="selectAllLocal"
        >
          <ui-spinner
            v-if="backupState.workflowId === workflow.id"
            color="text-accent"
            class="ml-4"
          />
          <button
            v-else-if="
              !backupState.uploading &&
              state.selectedWorkflows.length <= workflowLimit
            "
            class="ml-4 invisible group-hover:visible"
            @click="backupWorkflowsToCloud(workflow.id)"
          >
            <v-remixicon name="riUploadCloud2Line" />
          </button>
        </settings-backup-items>
      </template>
    </div>
  </div>
</template>
<script setup>
import { computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { fetchApi, cacheApi } from '@/utils/api';
import { convertWorkflow } from '@/utils/workflow-data';
import { parseJSON } from '@/utils/helper';
import dayjs from '@/lib/dayjs';
import Workflow from '@/models/workflow';
import SettingsBackupItems from './SettingsBackupItems.vue';

defineEmits(['close']);

const { t } = useI18n();
const store = useStore();
const toast = useToast();

const state = reactive({
  query: '',
  deleteIds: [],
  activeTab: 'local',
  cloudWorkflows: [],
  selectedWorkflows: [],
  backupRetrieved: false,
});
const backupState = reactive({
  workflowId: '',
  deleting: false,
  uploading: false,
});

const workflows = computed(() =>
  Workflow.query()
    .where(({ name, id }) => {
      const isInCloud = state.cloudWorkflows.some(
        (workflow) => workflow.id === id
      );

      return (
        name.toLocaleLowerCase().includes(state.query.toLowerCase()) &&
        !isInCloud
      );
    })
    .orderBy('createdAt', 'desc')
    .get()
);
const backupWorkflows = computed(() =>
  state.cloudWorkflows.filter(({ name }) =>
    name.toLocaleLowerCase().includes(state.query.toLowerCase())
  )
);
const workflowLimit = computed(() => {
  const maxWorkflow = store.state.user.limit.backupWorkflow;

  return maxWorkflow - state.cloudWorkflows.length;
});

function formatDate(workflow, format) {
  return dayjs(workflow.updatedAt || Date.now()).format(format);
}
function selectAllCloud(value) {
  if (value) {
    state.deleteIds = state.cloudWorkflows.map(({ id }) => id);
  } else {
    state.deleteIds = [];
  }
}
function selectAllLocal() {
  let limit = state.selectedWorkflows.length;

  if (limit >= workflowLimit.value) {
    state.selectedWorkflows = [];
    return;
  }

  workflows.value.forEach(({ id }) => {
    if (limit >= workflowLimit.value || state.selectedWorkflows.includes(id))
      return;

    state.selectedWorkflows.push(id);

    limit += 1;
  });
}
async function deleteBackup(workflowId) {
  try {
    backupState.deleting = true;

    if (workflowId) backupState.workflowId = workflowId;

    const ids = workflowId ? [workflowId] : state.deleteIds;
    const response = await fetchApi(
      `/me/workflows?id=${ids.join(',')}&type=backup`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) throw new Error(response.statusText);

    ids.forEach((id) => {
      const index = state.cloudWorkflows.findIndex((item) => item.id === id);

      if (index !== -1) state.cloudWorkflows.splice(index, 1);
    });

    await browser.storage.local.set({
      backupIds: state.cloudWorkflows.map(({ id }) => id),
    });

    state.deleteIds = [];
    backupState.workflowId = '';
    backupState.deleting = false;
    sessionStorage.removeItem('backup-workflows');
  } catch (error) {
    console.error(error);
    backupState.workflowId = '';
    backupState.deleting = false;
    toast.error(t('message.somethingWrong'));
    backupState.uploading = false;
  }
}
async function fetchCloudWorkflows() {
  if (state.backupRetrieved) return;

  state.deleteIds = [];

  try {
    const data = await cacheApi('backup-workflows', async () => {
      const response = await fetchApi('/me/workflows?type=backup');

      if (!response.ok) throw new Error(response.statusText);

      const result = await response.json();

      return result;
    });

    state.cloudWorkflows = data;
    state.backupRetrieved = true;
  } catch (error) {
    console.error(error);
    state.loadingBackup = false;
  }
}
async function backupWorkflowsToCloud(workflowId) {
  if (backupState.uploading) return;

  try {
    backupState.uploading = true;

    if (workflowId) backupState.workflowId = workflowId;

    const workflowIds = workflowId ? [workflowId] : state.selectedWorkflows;
    const workflowsPayload = workflowIds.reduce((acc, id) => {
      const findWorkflow = Workflow.find(id);

      if (!findWorkflow) return acc;

      const workflow = convertWorkflow(findWorkflow, [
        'dataColumns',
        'id',
        '__id',
      ]);
      delete workflow.extVersion;

      if (!workflow.__id) delete workflow.__id;

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

    backupState.uploading = false;
    backupState.workflowId = '';

    ids.forEach((id) => {
      const isExists = state.cloudWorkflows.some(
        (workflow) => workflow.id === id
      );
      if (isExists) return;

      state.cloudWorkflows.push(Workflow.find(id));
    });

    state.lastSync = lastBackup;
    state.selectedWorkflows = [];
    state.lastBackup = lastBackup;

    const userWorkflows = parseJSON('user-workflows', {
      backup: [],
      hosted: {},
    });
    userWorkflows.backup = state.cloudWorkflows;
    sessionStorage.setItem('user-workflows', JSON.stringify(userWorkflows));

    await Workflow.insertOrUpdate({ data });
    await browser.storage.local.set({
      lastBackup,
      backupIds: ids,
      lastSync: lastBackup,
    });

    sessionStorage.removeItem('backup-workflows');
    sessionStorage.removeItem('user-workflows');
    sessionStorage.removeItem('cache-time:backup-workflows');
  } catch (error) {
    console.error(error);
    toast.error(error.message);
    backupState.workflowId = '';
    backupState.uploading = false;
  }
}

onMounted(async () => {
  await fetchCloudWorkflows();
});
</script>
<style>
.cloud-backup .content {
  height: calc(100vh - 10rem);
  max-height: 1200px;
}
</style>
