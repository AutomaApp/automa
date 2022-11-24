<template>
  <div
    :class="[!showTab ? 'h-48' : 'h-56']"
    class="bg-accent rounded-b-2xl absolute top-0 left-0 w-full"
  ></div>
  <div
    :class="[!showTab ? 'mb-6' : 'mb-2']"
    class="dark placeholder-black relative z-10 text-white px-5 pt-8"
  >
    <div class="flex items-center mb-4">
      <h1 class="text-xl font-semibold text-white">Automa</h1>
      <div class="flex-grow"></div>
      <ui-button
        v-tooltip.group="
          'Start recording by opening the dashboard. Click to learn more'
        "
        icon
        class="mr-2"
        @click="openDocs"
      >
        <v-remixicon name="riRecordCircleLine" />
      </ui-button>
      <ui-button
        v-tooltip.group="
          t(`home.elementSelector.${state.haveAccess ? 'name' : 'noAccess'}`)
        "
        icon
        class="mr-2"
        @click="initElementSelector"
      >
        <v-remixicon name="riFocus3Line" />
      </ui-button>
      <ui-button
        v-tooltip.group="t('common.dashboard')"
        icon
        :title="t('common.dashboard')"
        @click="openDashboard('')"
      >
        <v-remixicon name="riHome5Line" />
      </ui-button>
    </div>
    <div class="flex">
      <ui-input
        v-model="state.query"
        :placeholder="`${t('common.search')}...`"
        autocomplete="off"
        prepend-icon="riSearch2Line"
        class="w-full search-input"
      />
    </div>
    <ui-tabs
      v-if="showTab"
      v-model="state.activeTab"
      fill
      class="mt-1"
      @change="onTabChange"
    >
      <ui-tab value="local">
        {{ t(`home.workflow.type.local`) }}
      </ui-tab>
      <ui-tab v-if="hostedWorkflowStore.toArray.length > 0" value="host">
        {{ t(`home.workflow.type.host`) }}
      </ui-tab>
      <ui-tab v-if="userStore.user?.teams?.length" value="team"> Teams </ui-tab>
    </ui-tabs>
  </div>
  <home-team-workflows
    v-if="state.retrieved"
    v-show="state.activeTab === 'team'"
    :search="state.query"
  />
  <div
    v-if="state.activeTab !== 'team'"
    class="px-5 z-20 relative pb-5 space-y-2"
  >
    <ui-card v-if="workflowStore.getWorkflows.length === 0" class="text-center">
      <img src="@/assets/svg/alien.svg" />
      <p class="font-semibold">{{ t('message.empty') }}</p>
      <ui-button
        variant="accent"
        class="mt-6"
        @click="openDashboard('/workflows')"
      >
        {{ t('home.workflow.new') }}
      </ui-button>
    </ui-card>
    <div v-if="pinnedWorkflows.length > 0" class="mt-1 mb-4 border-b pb-4">
      <div class="flex items-center text-gray-300 mb-1">
        <v-remixicon name="riPushpin2Line" size="20" class="mr-2" />
        <span>Pinned workflows</span>
      </div>
      <home-workflow-card
        v-for="workflow in pinnedWorkflows"
        :key="workflow.id"
        :workflow="workflow"
        :tab="state.activeTab"
        :pinned="true"
        class="mb-2"
        @details="openWorkflowPage"
        @update="updateWorkflow(workflow.id, $event)"
        @execute="executeWorkflow"
        @rename="renameWorkflow"
        @delete="deleteWorkflow"
        @toggle-pin="togglePinWorkflow(workflow)"
      />
    </div>
    <home-workflow-card
      v-for="workflow in workflows"
      :key="workflow.id"
      :workflow="workflow"
      :tab="state.activeTab"
      :pinned="state.pinnedWorkflows.includes(workflow.id)"
      @details="openWorkflowPage"
      @update="updateWorkflow(workflow.id, $event)"
      @execute="executeWorkflow"
      @rename="renameWorkflow"
      @delete="deleteWorkflow"
      @toggle-pin="togglePinWorkflow(workflow)"
    />
    <div
      v-if="state.showSettingsPopup"
      class="bg-accent fixed bottom-5 left-0 m-4 p-4 rounded-lg dark:text-black text-white shadow-md"
    >
      <p class="leading-tight text-sm">
        If the workflow runs for less than 5 minutes, set it to run in the
        background in the
        <a
          href="https://docs.automa.site/workflow/settings.html#workflow-execution"
          class="font-semibold underline"
          target="_blank"
        >
          workflow settings.
        </a>
      </p>
      <v-remixicon
        name="riCloseLine"
        class="absolute dark:text-gray-600 text-gray-300 top-2 right-2 cursor-pointer"
        size="20"
        @click="closeSettingsPopup"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import { useUserStore } from '@/stores/user';
import { useDialog } from '@/composable/dialog';
import { sendMessage } from '@/utils/message';
import { useWorkflowStore } from '@/stores/workflow';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { parseJSON } from '@/utils/helper';
import { initElementSelector as initElementSelectorFunc } from '@/newtab/utils/elementSelector';
import automa from '@business';
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard.vue';
import HomeTeamWorkflows from '@/components/popup/home/HomeTeamWorkflows.vue';
import BackgroundUtils from '@/background/BackgroundUtils';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;

const { t } = useI18n();
const dialog = useDialog();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();

useGroupTooltip();

const state = shallowReactive({
  query: '',
  teams: [],
  cardHeight: 255,
  retrieved: false,
  haveAccess: true,
  activeTab: 'local',
  pinnedWorkflows: [],
  showSettingsPopup: isMV2
    ? false
    : parseJSON(localStorage.getItem('settingsPopup'), true) ?? true,
});

const pinnedWorkflows = computed(() => {
  if (state.activeTab !== 'local') return [];

  const list = [];
  state.pinnedWorkflows.forEach((workflowId) => {
    const workflow = workflowStore.getById(workflowId);
    if (
      !workflow ||
      !workflow.name
        .toLocaleLowerCase()
        .includes(state.query.toLocaleLowerCase())
    )
      return;

    list.push(workflow);
  });

  return list;
});
const hostedWorkflows = computed(() => {
  if (state.activeTab !== 'host') return [];

  return hostedWorkflowStore.toArray.filter((workflow) =>
    workflow.name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
  );
});
const localWorkflows = computed(() => {
  if (state.activeTab !== 'local') return [];

  return workflowStore.getWorkflows
    .filter(({ name }) =>
      name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
    )
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
});
const workflows = computed(() =>
  state.activeTab === 'local' ? localWorkflows.value : hostedWorkflows.value
);
const showTab = computed(
  () =>
    hostedWorkflowStore.toArray.length > 0 || userStore.user?.teams?.length > 0
);

function openDocs() {
  window.open(
    'https://docs.automa.site/guide/quick-start.html#recording-actions',
    '_blank'
  );
}
function closeSettingsPopup() {
  state.showSettingsPopup = false;
  localStorage.setItem('settingsPopup', false);
}
function togglePinWorkflow(workflow) {
  const index = state.pinnedWorkflows.indexOf(workflow.id);
  const copyData = [...state.pinnedWorkflows];

  if (index === -1) {
    copyData.push(workflow.id);
  } else {
    copyData.splice(index, 1);
  }

  state.pinnedWorkflows = copyData;
  browser.storage.local.set({
    pinnedWorkflows: copyData,
  });
}
async function executeWorkflow(workflow) {
  try {
    const [tab] = await browser.tabs.query({
      url: browser.runtime.getURL('/newtab.html'),
    });
    if (tab && !isMV2) {
      await browser.tabs.sendMessage(tab.id, {
        type: 'workflow:execute',
        data: {
          data: workflow,
          options: workflow?.options,
        },
      });
    } else {
      await sendMessage('workflow:execute', workflow, 'background');
    }

    window.close();
  } catch (error) {
    console.error(error);
  }
}
function updateWorkflow(id, data) {
  return workflowStore.update({
    id,
    data,
  });
}
function renameWorkflow({ id, name }) {
  dialog.prompt({
    title: t('home.workflow.rename'),
    placeholder: t('common.name'),
    okText: t('common.rename'),
    inputValue: name,
    onConfirm: (newName) => {
      updateWorkflow(id, { name: newName });
    },
  });
}
function deleteWorkflow({ id, name }) {
  dialog.confirm({
    title: t('home.workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name }),
    onConfirm: () => {
      if (state.activeTab === 'local') {
        workflowStore.delete(id);
      } else {
        hostedWorkflowStore.delete(id);
      }
    },
  });
}
function openDashboard(url) {
  BackgroundUtils.openDashboard(url);
}
async function initElementSelector() {
  const [tab] = await browser.tabs.query({
    url: '*://*/*',
    active: true,
    currentWindow: true,
  });
  if (!tab) return;
  initElementSelectorFunc(tab).then(() => {
    window.close();
  });
}
function openWorkflowPage({ id, hostId }) {
  let url = `/workflows/${id}`;

  if (state.activeTab === 'host') {
    url = `/workflows/${hostId}/host`;
  }

  openDashboard(url);
}
function onTabChange(value) {
  localStorage.setItem('popup-tab', value);
}

onMounted(async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  state.haveAccess = /^(https?)/.test(tab.url);

  const storage = await browser.storage.local.get('pinnedWorkflows');
  state.pinnedWorkflows = storage.pinnedWorkflows || [];

  await userStore.loadUser({ storage: localStorage, ttl: 1000 * 60 * 5 });
  await teamWorkflowStore.loadData();

  let activeTab = localStorage.getItem('popup-tab') || 'local';

  await automa('app');

  if (activeTab === 'team' && !userStore.user?.teams) activeTab = 'local';
  else if (activeTab === 'host' && hostedWorkflowStore.toArray.length < 0)
    activeTab = 'local';

  state.retrieved = true;
  state.activeTab = activeTab;
});
</script>
<style>
.recording-card {
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
}
</style>
