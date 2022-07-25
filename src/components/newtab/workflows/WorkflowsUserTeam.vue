<template>
  <p v-if="!userStore.user" class="text-center my-4">
    <ui-spinner v-if="!userStore.retrieved" color="text-accent" />
    <template v-else>
      You must
      <a href="https://www.automa.site/auth" class="underline" target="_blank"
        >login</a
      >
      to use these workflows
    </template>
  </p>
  <div v-else-if="teamWorkflows.length === 0" class="text-center">
    <img src="@/assets/svg/files-and-folder.svg" class="mx-auto w-96" />
    <p class="text-lg font-semibold">Nothing to see here</p>
    <p class="text-gray-600 dark:text-gray-200">
      Browse workflows that been shared by your team
    </p>
    <ui-button
      :href="`http://www.automa.site/workflows?teamId=${teamId}&workflowsBy=team`"
      tag="a"
      target="_blank"
      variant="accent"
      class="mt-8 inline-block"
    >
      Browse workflows
    </ui-button>
  </div>
  <div v-else class="workflows-container">
    <shared-card
      v-for="workflow in workflows"
      :key="workflow.id"
      :data="workflow"
      :menu="workflowMenus"
      @menuSelected="onMenuSelected"
      @execute="executeWorkflow(workflow)"
      @click="$router.push(`/teams/${teamId}/workflows/${$event.id}`)"
    >
      <template #footer-content>
        <span
          :class="tagColors[workflow.tag]"
          class="text-sm rounded-md text-black capitalize p-1"
        >
          {{ workflow.tag }}
        </span>
      </template>
    </shared-card>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { fetchApi } from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { sendMessage } from '@/utils/message';
import { arraySorter } from '@/utils/helper';
import { useDialog } from '@/composable/dialog';
import { tagColors } from '@/utils/shared';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
  teamId: {
    type: [String, Number],
    default: '',
  },
  sort: {
    type: Object,
    default: () => ({
      by: '',
      order: '',
    }),
  },
});

const menu = [
  {
    id: 'delete',
    name: 'Delete',
    hasAccess: true,
    icon: 'riDeleteBin7Line',
    attrs: {
      class: 'text-red-400 dark:text-gray-500',
    },
  },
  {
    id: 'delete-team',
    name: 'Delete from team',
    icon: 'riDeleteBin7Line',
    permissions: ['owner', 'create'],
    attrs: {
      class: 'text-red-400 dark:text-gray-500',
    },
  },
];

const { t } = useI18n();
const toast = useToast();
const dialog = useDialog();
const userStore = useUserStore();
const teamWorkflowStore = useTeamWorkflowStore();

const workflowMenus = computed(() =>
  menu.filter((item) => {
    if (!item.permissions) return true;

    return userStore.validateTeamAccess(props.teamId, item.permissions);
  })
);
const teamWorkflows = computed(() => teamWorkflowStore.getByTeam(props.teamId));
const workflows = computed(() => {
  const filtered = teamWorkflows.value.filter(({ name }) =>
    name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  );

  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});

function executeWorkflow(workflow) {
  sendMessage('workflow:execute', workflow, 'background');
}
function onMenuSelected({ id, data }) {
  if (id === 'delete') {
    dialog.confirm({
      title: t('workflow.delete'),
      okVariant: 'danger',
      body: t('message.delete', { name: data.name }),
      onConfirm: () => {
        teamWorkflowStore.delete(data.teamId, data.id);
      },
    });
  } else if (id === 'delete-team') {
    dialog.confirm({
      async: true,
      title: 'Delete workflow from team',
      okVariant: 'danger',
      body: `Are you sure want to delete the "${data.name}" workflow from this team?`,
      onConfirm: async () => {
        try {
          const response = await fetchApi(
            `/teams/${props.teamId}/workflows/${data.id}`,
            { method: 'DELETE' }
          );
          const result = await response.json();

          if (!response.ok && response.status !== 404)
            throw new Error(result.message);

          await teamWorkflowStore.delete(props.teamId, data.id);

          return true;
        } catch (error) {
          toast.error('Something went wrong');
          console.error(error);
          return false;
        }
      },
    });
  }
}
</script>
