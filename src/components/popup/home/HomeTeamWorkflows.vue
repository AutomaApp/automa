<template>
  <div class="space-y-2 px-5 pb-5">
    <ui-card
      v-for="workflow in workflows"
      :key="workflow.id"
      class="relative flex w-full items-center space-x-2 hover:ring-2 hover:ring-gray-900"
    >
      <div
        class="text-overflow mr-4 flex-1 cursor-pointer"
        @click="openWorkflowPage(workflow)"
      >
        <p class="text-overflow leading-tight">{{ workflow.name }}</p>
        <div class="flex items-center text-gray-500">
          <span>{{ dayjs(workflow.createdAt).fromNow() }}</span>
          <div class="grow" />
          <span
            :class="tagColors[workflow.tag]"
            class="text-overflow ml-2 rounded-md px-2 py-1 text-sm text-gray-600"
            style="max-width: 120px"
          >
            {{ workflow.tag }}
          </span>
        </div>
      </div>
      <p v-if="workflow.isDisabled" class="text-sm text-gray-600">Disabled</p>
      <button v-else title="Execute" @click="executeWorkflow(workflow)">
        <v-remixicon name="riPlayLine" />
      </button>
    </ui-card>
  </div>
</template>
<script setup>
import { computed, onMounted, shallowRef } from 'vue';
import { useUserStore } from '@/stores/user';
import { sendMessage } from '@/utils/message';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { tagColors } from '@/utils/shared';
import dayjs from '@/lib/dayjs';

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
});

const userStore = useUserStore();
const teamWorkflowStore = useTeamWorkflowStore();

const teamWorkflows = shallowRef([]);

const workflows = computed(() =>
  teamWorkflows.value.filter((workflow) =>
    workflow.name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  )
);

function openWorkflowPage({ teamId, id }) {
  const url = `/teams/${teamId}/workflows/${id}`;
  sendMessage('open:dashboard', url, 'background');
}
function executeWorkflow(workflow) {
  sendMessage('workflow:execute', workflow, 'background');
}

onMounted(() => {
  if (!userStore.user?.teams) return;

  teamWorkflows.value = userStore.user.teams
    .reduce((acc, team) => {
      const currentWorkflows = teamWorkflowStore
        .getByTeam(team.id)
        .map((workflow) => {
          workflow.teamId = team.id;
          workflow.teamName = team.name;

          return workflow;
        });
      acc.push(...currentWorkflows);

      return acc;
    }, [])
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
});
</script>
