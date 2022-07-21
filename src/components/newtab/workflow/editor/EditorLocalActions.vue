<template>
  <span
    v-if="isTeam && workflow.tag"
    :class="tagColors[workflow.tag]"
    class="text-sm rounded-md text-black capitalize p-1 mr-2"
  >
    {{ workflow.tag }}
  </span>
  <ui-card v-if="!isTeam || !canEdit" padding="p-1 pointer-events-auto">
    <button
      v-tooltip.group="'Workflow note'"
      class="hoverable p-2 rounded-lg"
      @click="state.showNoteModal = true"
    >
      <v-remixicon name="riFileEditLine" />
    </button>
  </ui-card>
  <ui-card
    v-if="!isTeam"
    padding="p-1"
    class="flex items-center pointer-events-auto ml-4"
  >
    <ui-popover>
      <template #trigger>
        <button
          v-tooltip.group="t('workflow.host.title')"
          class="hoverable p-2 rounded-lg"
        >
          <v-remixicon
            :class="{ 'text-primary': hosted }"
            name="riBaseStationLine"
          />
        </button>
      </template>
      <div :class="{ 'text-center': state.isUploadingHost }" class="w-64">
        <div class="flex items-center text-gray-600 dark:text-gray-200">
          <p>
            {{ t('workflow.host.set') }}
          </p>
          <a
            :title="t('common.docs')"
            href="https://docs.automa.site/guide/host-workflow.html"
            target="_blank"
            class="ml-1"
          >
            <v-remixicon name="riInformationLine" size="20" />
          </a>
          <div class="flex-grow"></div>
          <ui-spinner v-if="state.isUploadingHost" color="text-accent" />
          <ui-switch
            v-else
            :model-value="Boolean(hosted)"
            @change="setAsHostWorkflow"
          />
        </div>
        <transition-expand>
          <ui-input
            v-if="hosted"
            v-tooltip:bottom="t('workflow.host.id')"
            :model-value="hosted.hostId"
            prepend-icon="riLinkM"
            readonly
            class="mt-4 block w-full"
            @click="$event.target.select()"
          />
        </transition-expand>
      </div>
    </ui-popover>
    <ui-popover :disabled="userDontHaveTeamsAccess">
      <template #trigger>
        <button
          v-tooltip.group="t('workflow.share.title')"
          :class="{ 'text-primary': shared }"
          class="hoverable p-2 rounded-lg"
          @click="shareWorkflow(!userDontHaveTeamsAccess)"
        >
          <v-remixicon name="riShareLine" />
        </button>
      </template>
      <p class="font-semibold">Share the workflow</p>
      <ui-list class="mt-2 space-y-1 w-56">
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="shareWorkflowWithTeam"
        >
          <v-remixicon name="riTeamLine" class="-ml-1 mr-2" />
          With your team
        </ui-list-item>
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="shareWorkflow()"
        >
          <v-remixicon name="riGroupLine" class="-ml-1 mr-2" />
          With the community
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </ui-card>
  <ui-card padding="p-1 ml-4 pointer-events-auto">
    <button
      v-for="item in modalActions"
      :key="item.id"
      v-tooltip.group="item.name"
      class="hoverable p-2 rounded-lg"
      @click="$emit('modal', item.id)"
    >
      <v-remixicon :name="item.icon" />
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4 flex items-center pointer-events-auto">
    <button
      v-if="!workflow.isDisabled"
      v-tooltip.group="
        `${t('common.execute')} (${
          shortcuts['editor:execute-workflow'].readable
        })`
      "
      class="hoverable p-2 rounded-lg"
      @click="executeWorkflow"
    >
      <v-remixicon name="riPlayLine" />
    </button>
    <button
      v-else
      v-tooltip="t('workflow.clickToEnable')"
      class="p-2"
      @click="updateWorkflow({ isDisabled: false })"
    >
      {{ t('common.disabled') }}
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4 space-x-1 pointer-events-auto flex items-center">
    <button
      v-if="!canEdit"
      v-tooltip.group="state.triggerText"
      class="p-2 hoverable rounded-lg"
    >
      <v-remixicon name="riFlashlightLine" />
    </button>
    <ui-popover v-if="canEdit">
      <template #trigger>
        <button class="rounded-lg p-2 hoverable">
          <v-remixicon name="riMore2Line" />
        </button>
      </template>
      <ui-list style="min-width: 9rem">
        <ui-list-item
          v-if="isTeam && canEdit"
          v-close-popover
          class="cursor-pointer"
          @click="syncWorkflow"
        >
          <v-remixicon name="riRefreshLine" class="mr-2 -ml-1" />
          <span>{{ t('workflow.host.sync.title') }}</span>
        </ui-list-item>
        <ui-list-item
          class="cursor-pointer"
          @click="updateWorkflow({ isDisabled: !workflow.isDisabled })"
        >
          <v-remixicon name="riToggleLine" class="mr-2 -ml-1" />
          {{ t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`) }}
        </ui-list-item>
        <ui-list-item
          v-for="item in moreActions"
          :key="item.id"
          v-close-popover
          class="cursor-pointer"
          @click="item.action"
        >
          <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
          {{ item.name }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
    <ui-button
      v-if="!isTeam"
      :title="shortcuts['editor:save'].readable"
      variant="accent"
      class="relative"
      @click="saveWorkflow"
    >
      <span
        v-if="isDataChanged"
        class="flex h-3 w-3 absolute top-0 left-0 -ml-1 -mt-1"
      >
        <span
          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
        ></span>
        <span
          class="relative inline-flex rounded-full h-3 w-3 bg-blue-600"
        ></span>
      </span>
      <v-remixicon name="riSaveLine" class="mr-2 -ml-1 my-1" />
      {{ t('common.save') }}
    </ui-button>
    <ui-button
      v-else-if="!canEdit"
      v-tooltip.group="'Sync workflow'"
      :loading="state.loadingSync"
      variant="accent"
      @click="syncWorkflow"
    >
      <v-remixicon name="riRefreshLine" class="mr-2 -ml-1" />
      <span>
        {{ t('workflow.host.sync.title') }}
      </span>
    </ui-button>
    <template v-else>
      <ui-button
        v-tooltip="`Save workflow (${shortcuts['editor:save'].readable})`"
        class="mr-2"
        icon
        @click="saveWorkflow"
      >
        <span
          v-if="isDataChanged"
          class="flex h-3 w-3 absolute top-0 left-0 -ml-1 -mt-1"
        >
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
          ></span>
          <span
            class="relative inline-flex rounded-full h-3 w-3 bg-blue-600"
          ></span>
        </span>
        <v-remixicon name="riSaveLine" />
      </ui-button>
      <ui-button
        v-tooltip="'Publish workflow update'"
        :loading="state.isPublishing"
        variant="accent"
        @click="publishWorkflow"
      >
        Publish
      </ui-button>
    </template>
  </ui-card>
  <ui-modal v-model="state.showEditDescription" persist blur custom-content>
    <workflow-share-team
      :workflow="workflow"
      :is-update="true"
      @update="updateWorkflowDescription"
      @close="state.showEditDescription = false"
    />
  </ui-modal>
  <ui-modal v-model="renameState.showModal" title="Workflow">
    <ui-input
      v-model="renameState.name"
      :placeholder="t('common.name')"
      autofocus
      class="w-full mb-4"
      @keyup.enter="renameWorkflow"
    />
    <ui-textarea
      v-model="renameState.description"
      :placeholder="t('common.description')"
      height="165px"
      class="w-full dark:text-gray-200"
      max="300"
      style="min-height: 140px"
    />
    <p class="mb-6 text-right text-gray-600 dark:text-gray-200">
      {{ renameState.description.length }}/300
    </p>
    <div class="space-x-2 flex">
      <ui-button class="w-full" @click="clearRenameModal">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button variant="accent" class="w-full" @click="renameWorkflow">
        {{ t('common.update') }}
      </ui-button>
    </div>
  </ui-modal>
  <ui-modal
    v-model="state.showNoteModal"
    title="Workflow note"
    content-class="max-w-2xl"
  >
    <shared-wysiwyg
      :model-value="workflow.content || ''"
      :limit="1000"
      :readonly="!canEdit"
      class="bg-box-transparent p-4 rounded-lg overflow-auto scroll"
      placeholder="Write note here..."
      style="max-height: calc(100vh - 12rem); min-height: 400px"
      @change="updateWorkflow({ content: $event }, true)"
    />
  </ui-modal>
</template>
<script setup>
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { sendMessage } from '@/utils/message';
import { fetchApi } from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { useDialog } from '@/composable/dialog';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useShortcut, getShortcut } from '@/composable/shortcut';
import { tagColors } from '@/utils/shared';
import { parseJSON, findTriggerBlock } from '@/utils/helper';
import { exportWorkflow, convertWorkflow } from '@/utils/workflowData';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import getTriggerText from '@/utils/triggerText';
import convertWorkflowData from '@/utils/convertWorkflowData';
import SharedWysiwyg from '@/components/newtab/shared/SharedWysiwyg.vue';
import WorkflowShareTeam from '@/components/newtab/workflow/WorkflowShareTeam.vue';

const props = defineProps({
  isDataChanged: {
    type: Boolean,
    default: false,
  },
  workflow: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
  changedData: {
    type: Object,
    default: () => ({}),
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  isTeam: Boolean,
});
const emit = defineEmits(['modal', 'change', 'update', 'permission']);

useGroupTooltip();

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const dialog = useDialog();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const teamWorkflow = useTeamWorkflowStore();
const sharedWorkflowStore = useSharedWorkflowStore();
const shortcuts = useShortcut([
  /* eslint-disable-next-line */
  getShortcut('editor:save', saveWorkflow),
  /* eslint-disable-next-line */
  getShortcut('editor:execute-workflow', executeWorkflow),
]);

const { teamId } = router.currentRoute.value.params;

const state = reactive({
  triggerText: '',
  loadingSync: false,
  isPublishing: false,
  showNoteModal: false,
  isUploadingHost: false,
  showEditDescription: false,
});
const renameState = reactive({
  name: '',
  description: '',
  showModal: false,
});

const shared = computed(() => sharedWorkflowStore.getById(props.workflow.id));
const hosted = computed(() => userStore.hostedWorkflows[props.workflow.id]);
const userDontHaveTeamsAccess = computed(() => {
  if (props.isTeam || !userStore.user.teams) return false;

  return !userStore.user.teams.some((team) =>
    team.access.some((item) => ['owner', 'create'].includes(item))
  );
});

function updateWorkflow(data = {}, changedIndicator = false) {
  let store = null;

  if (props.isTeam) {
    store = teamWorkflow.update({
      data,
      teamId,
      id: props.workflow.id,
    });
  } else {
    store = workflowStore.update({
      data,
      id: props.workflow.id,
    });
  }

  return store.then((result) => {
    emit('update', { data, changedIndicator });

    return result;
  });
}
function updateWorkflowDescription(value) {
  const keys = ['description', 'category', 'content', 'tag', 'name'];
  const payload = {};

  keys.forEach((key) => {
    payload[key] = value[key];
  });

  updateWorkflow(payload);
  state.showEditDescription = false;
}
function executeWorkflow() {
  sendMessage(
    'workflow:execute',
    {
      ...props.workflow,
      isTesting: props.isDataChanged,
    },
    'background'
  );
}
async function setAsHostWorkflow(isHost) {
  if (!userStore.user) {
    dialog.custom('auth', {
      title: t('auth.title'),
    });
    return;
  }

  state.isUploadingHost = true;

  try {
    let url = '/me/workflows';
    let payload = {};

    if (isHost) {
      const workflowPaylod = convertWorkflow(props.workflow, ['id']);
      workflowPaylod.drawflow = parseJSON(
        props.workflow.drawflow,
        props.workflow.drawflow
      );
      delete workflowPaylod.extVersion;

      url += `/host`;
      payload = {
        method: 'POST',
        body: JSON.stringify({
          workflow: workflowPaylod,
        }),
      };
    } else {
      url += `?id=${props.workflow.id}&type=host`;
      payload.method = 'DELETE';
    }

    const response = await fetchApi(url, payload);
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.message);
      error.data = result.data;

      throw error;
    }

    if (isHost) {
      userStore.hostedWorkflows[props.workflow.id] = result;
    } else {
      delete userStore.hostedWorkflows[props.workflow.id];
    }

    // Update cache
    const userWorkflows = parseJSON('user-workflows', {
      backup: [],
      hosted: {},
    });
    userWorkflows.hosted = userStore.hostedWorkflows;
    sessionStorage.setItem('user-workflows', JSON.stringify(userWorkflows));

    state.isUploadingHost = false;
  } catch (error) {
    console.error(error);
    state.isUploadingHost = false;
    toast.error(error.message);
  }
}
function shareWorkflowWithTeam() {
  emit('modal', 'workflow-share-team');
}
function shareWorkflow(disabled = false) {
  if (disabled) return;
  if (shared.value) {
    router.push(`/workflows/${props.workflow.id}/shared`);
    return;
  }

  if (userStore.user) {
    emit('modal', 'workflow-share');
  } else {
    dialog.custom('auth', {
      title: t('auth.title'),
    });
  }
}
function clearRenameModal() {
  Object.assign(renameState, {
    id: '',
    name: '',
    description: '',
    showModal: false,
  });
}
async function publishWorkflow() {
  if (!props.canEdit) return;

  const workflowPaylod = convertWorkflow(props.workflow, [
    'id',
    'tag',
    'content',
  ]);
  workflowPaylod.drawflow = parseJSON(
    props.workflow.drawflow,
    props.workflow.drawflow
  );
  delete workflowPaylod.id;
  delete workflowPaylod.extVersion;

  state.isPublishing = true;

  try {
    const response = await fetchApi(
      `/teams/${teamId}/workflows/${props.workflow.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ workflow: workflowPaylod }),
      }
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong');
  } finally {
    state.isPublishing = false;
  }
}
function initRenameWorkflow() {
  if (props.isTeam) {
    state.showEditDescription = true;
    return;
  }

  Object.assign(renameState, {
    showModal: true,
    name: `${props.workflow.name}`,
    description: `${props.workflow.description}`,
  });
}
function renameWorkflow() {
  updateWorkflow({
    name: renameState.name,
    description: renameState.description,
  });
  clearRenameModal();
}
function deleteWorkflow() {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: props.workflow.name }),
    onConfirm: async () => {
      await workflowStore.delete(props.workflow.id);
      router.replace('/');
    },
  });
}
async function saveWorkflow() {
  try {
    const flow = props.editor.toObject();
    flow.edges = flow.edges.map((edge) => {
      delete edge.sourceNode;
      delete edge.targetNode;

      return edge;
    });

    const triggerBlock = flow.nodes.find((node) => node.label === 'trigger');
    if (!triggerBlock) {
      toast.error(t('message.noTriggerBlock'));
      return;
    }

    await updateWorkflow(
      {
        drawflow: flow,
        trigger: triggerBlock.data,
        version: browser.runtime.getManifest().version,
      },
      false
    );
    await registerWorkflowTrigger(props.workflow.id, triggerBlock);

    emit('change', { drawflow: flow });
  } catch (error) {
    console.error(error);
  }
}
async function retrieveTriggerText() {
  if (props.canEdit) return;

  const triggerBlock = findTriggerBlock(props.workflow.drawflow);
  if (!triggerBlock) return;

  state.triggerText = await getTriggerText(
    triggerBlock.data,
    t,
    router.currentRoute.value.params.id,
    true
  );
}
async function syncWorkflow() {
  state.loadingSync = true;

  if (props.canEdit)
    toast('Syncing workflow...', { timeout: false, id: 'sync' });

  try {
    const response = await fetchApi(
      `/teams/${teamId}/workflows/${props.workflow.id}`
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    await teamWorkflow.update({
      teamId,
      data: result,
      id: props.workflow.id,
    });

    const convertedData = convertWorkflowData(result);
    props.editor.setNodes(convertedData.drawflow.nodes || []);
    props.editor.setEdges(convertedData.drawflow.edges || []);
    props.editor.fitView();

    await retrieveTriggerText();

    const triggerBlock = convertedData.drawflow.nodes.find(
      (node) => node.label === 'trigger'
    );
    registerWorkflowTrigger(props.workflow.id, triggerBlock);
    emit('permission');
  } catch (error) {
    toast.error(error.message);
    console.error(error);
  } finally {
    state.loadingSync = false;
    toast.dismiss('sync');
  }
}

retrieveTriggerText();

const modalActions = [
  {
    id: 'table',
    hasAccess: props.canEdit,
    name: t('workflow.table.title'),
    icon: 'riTable2',
  },
  {
    hasAccess: true,
    id: 'global-data',
    name: t('common.globalData'),
    icon: 'riDatabase2Line',
  },
  {
    id: 'settings',
    hasAccess: props.canEdit,
    name: t('common.settings'),
    icon: 'riSettings3Line',
  },
].filter((item) => item.hasAccess);
const moreActions = [
  {
    id: 'export',
    icon: 'riDownloadLine',
    name: t('common.export'),
    action: () => exportWorkflow(props.workflow),
  },
  {
    id: 'rename',
    icon: 'riPencilLine',
    name: props.isTeam ? 'Edit detail' : t('common.rename'),
    action: initRenameWorkflow,
  },
  {
    id: 'delete',
    action: deleteWorkflow,
    name: t('common.delete'),
    icon: 'riDeleteBin7Line',
  },
];
</script>
