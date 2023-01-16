<template>
  <p v-if="!userStore.user" class="my-4 text-center">
    <ui-spinner v-if="!userStore.retrieved" color="text-accent" />
    <template v-else>
      You must
      <a href="https://www.automa.site/auth" class="underline" target="_blank"
        >login</a
      >
      to use these workflows
    </template>
  </p>
  <div
    v-else-if="!isUnknownTeam && teamWorkflows.length === 0"
    class="text-center"
  >
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
      :disabled="isUnknownTeam"
      @menuSelected="onMenuSelected"
      @execute="executeWorkflow(workflow)"
      @click="openWorkflowPage"
    >
      <template #footer-content>
        <span
          :class="tagColors[workflow.tag]"
          class="rounded-md p-1 text-sm capitalize text-black"
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
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { fetchApi } from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { arraySorter } from '@/utils/helper';
import { useDialog } from '@/composable/dialog';
import { tagColors } from '@/utils/shared';
import { executeWorkflow } from '@/workflowEngine';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

const props = defineProps({
  active: Boolean,
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
      class: 'text-red-400 dark:text-red-500',
    },
  },
  {
    id: 'delete-team',
    name: 'Delete from team',
    icon: 'riDeleteBin7Line',
    permissions: ['owner', 'create'],
    attrs: {
      class: 'text-red-400 dark:text-red-500',
    },
  },
];

const { t } = useI18n();
const toast = useToast();
const dialog = useDialog();
const router = useRouter();
const userStore = useUserStore();
const teamWorkflowStore = useTeamWorkflowStore();

const isUnknownTeam = computed(() => props.teamId === '(unknown)');
const workflowMenus = computed(() =>
  menu.filter((item) => {
    if (!item.permissions) return true;

    return userStore.validateTeamAccess(props.teamId, item.permissions);
  })
);
const teamWorkflows = computed(() => {
  if (isUnknownTeam.value) {
    return Object.keys(teamWorkflowStore.workflows).reduce((acc, teamId) => {
      const teamExist = userStore.user?.teams?.some(
        (team) => team.id === teamId || team.id === +teamId
      );
      if (!teamExist) {
        acc.push(...Object.values(teamWorkflowStore.workflows[teamId]));
      }

      return acc;
    }, []);
  }

  return teamWorkflowStore.getByTeam(props.teamId);
});
const workflows = computed(() => {
  if (!props.active) return [];

  const filtered = teamWorkflows.value.filter(({ name }) =>
    name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  );

  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});

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
function openWorkflowPage({ id }) {
  if (isUnknownTeam.value) return;

  router.push(`/teams/${props.teamId}/workflows/${id}`);
}
</script>
