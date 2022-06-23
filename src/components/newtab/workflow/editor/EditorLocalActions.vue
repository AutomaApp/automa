<template>
  <ui-card
    v-if="!workflow.isProtected"
    padding="p-1"
    class="flex items-center pointer-events-auto"
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
    <button
      v-tooltip.group="t('workflow.share.title')"
      :class="{ 'text-primary': shared }"
      class="hoverable p-2 rounded-lg"
      @click="shareWorkflow"
    >
      <v-remixicon name="riShareLine" />
    </button>
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
      @click="$emit('update', { isDisabled: false })"
    >
      {{ t('common.disabled') }}
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4 space-x-1 pointer-events-auto">
    <ui-popover>
      <template #trigger>
        <button class="rounded-lg p-2 hoverable">
          <v-remixicon name="riMore2Line" />
        </button>
      </template>
      <ui-list class="w-36">
        <ui-list-item
          class="cursor-pointer"
          @click="$emit('update', { isDisabled: !workflow.isDisabled })"
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
  </ui-card>
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
</template>
<script setup>
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { sendMessage } from '@/utils/message';
import { fetchApi } from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useDialog } from '@/composable/dialog';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useShortcut, getShortcut } from '@/composable/shortcut';
import { parseJSON } from '@/utils/helper';
import { exportWorkflow, convertWorkflow } from '@/utils/workflowData';
import workflowTrigger from '@/utils/workflowTrigger';

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
});
const emit = defineEmits(['modal', 'save', 'update']);

useGroupTooltip();

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const dialog = useDialog();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const shortcuts = useShortcut(
  [
    /* eslint-disable-next-line */
    getShortcut('editor:save', saveWorkflow),
    getShortcut('editor:execute-workflow', 'execute'),
  ],
  ({ data }) => {
    emit(data);
  }
);

const state = reactive({
  isUploadingHost: false,
});
const renameState = reactive({
  name: '',
  description: '',
  showModal: false,
});

const shared = computed(() =>
  workflowStore.getById('shared', props.workflow.id)
);
const hosted = computed(() =>
  workflowStore.getById('userHosted', props.workflow.id)
);

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
      workflowStore.userHosted[props.workflow.id] = result;
    } else {
      delete workflowStore.userHosted[props.workflow.id];
    }

    const userWorkflows = parseJSON('user-workflows', {
      backup: [],
      hosted: {},
    });
    userWorkflows.hosted = workflowStore.userHosted;
    sessionStorage.setItem('user-workflows', JSON.stringify(userWorkflows));

    state.isUploadingHost = false;
  } catch (error) {
    console.error(error);
    state.isUploadingHost = false;
    toast.error(error.message);
  }
}
function shareWorkflow() {
  if (shared.value) {
    router.push(`/${props.workflow.id}/shared`);
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
function initRenameWorkflow() {
  Object.assign(renameState, {
    showModal: true,
    name: `${props.workflow.name}`,
    description: `${props.workflow.description}`,
  });
}
function renameWorkflow() {
  workflowStore.updateWorkflow({
    location: 'local',
    id: props.workflow.id,
    data: {
      name: renameState.name,
      description: renameState.description,
    },
  });
  clearRenameModal();
}
function deleteWorkflow() {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: props.workflow.name }),
    onConfirm: async () => {
      await workflowStore.deleteWorkflow(props.workflow.id, 'local');
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

    workflowStore.updateWorkflow({
      location: 'local',
      id: props.workflow.id,
      data: {
        drawflow: flow,
        trigger: triggerBlock,
      },
    });

    workflowTrigger.register(props.workflow.id, triggerBlock);
    emit('save');
  } catch (error) {
    console.error(error);
  }
}
const modalActions = [
  {
    id: 'table',
    name: t('workflow.table.title'),
    icon: 'riTable2',
  },
  {
    id: 'global-data',
    name: t('common.globalData'),
    icon: 'riDatabase2Line',
  },
  {
    id: 'settings',
    name: t('common.settings'),
    icon: 'riSettings3Line',
  },
];
const moreActions = [
  {
    id: 'export',
    name: t('common.export'),
    icon: 'riDownloadLine',
    action: () => exportWorkflow(props.workflow),
  },
  {
    id: 'rename',
    icon: 'riPencilLine',
    name: t('common.rename'),
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
