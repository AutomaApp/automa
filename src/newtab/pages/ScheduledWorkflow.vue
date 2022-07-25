<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-8 capitalize">
      {{ t('scheduledWorkflow.title', 2) }}
    </h1>
    <ui-input
      v-model="state.query"
      prepend-icon="riSearch2Line"
      :placeholder="t('common.search')"
    />
    <ui-table
      :headers="tableHeaders"
      :items="triggers"
      item-key="id"
      class="w-full mt-4"
    >
      <template #item-name="{ item }">
        <router-link
          v-if="item.path"
          :to="item.path"
          class="block h-full w-full"
          style="min-height: 20px"
        >
          {{ item.name }}
        </router-link>
        <span v-else>
          {{ item.name }}
        </span>
      </template>
      <template #item-schedule="{ item }">
        <p v-tooltip="{ content: item.scheduleDetail, allowHTML: true }">
          {{ item.schedule }}
        </p>
      </template>
      <template #item-active="{ item }">
        <v-remixicon
          v-if="item.active"
          class="text-green-500 dark:text-green-400 inline-block"
          name="riCheckLine"
        />
        <span v-else></span>
      </template>
      <template #item-action="{ item }">
        <button
          v-tooltip="t('scheduledWorkflow.refresh')"
          class="rounded-md text-gray-600 dark:text-gray-300"
          @click="refreshSchedule(item.id)"
        >
          <v-remixicon name="riRefreshLine" />
        </button>
      </template>
    </ui-table>
  </div>
</template>
<script setup>
import { onMounted, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import browser from 'webextension-polyfill';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { findTriggerBlock, objectHasKey } from '@/utils/helper';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';

const { t } = useI18n();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();

const triggersData = {};
const state = reactive({
  query: '',
  triggers: [],
  activeTrigger: 'scheduled',
});

let rowId = 0;
const scheduledTypes = ['interval', 'date', 'specific-day'];
const tableHeaders = [
  {
    value: 'name',
    filterable: true,
    text: t('common.name'),
    attrs: {
      class: 'w-3/12',
    },
  },
  {
    value: 'schedule',
    text: t('scheduledWorkflow.schedule.title'),
    attrs: {
      class: 'w-4/12',
    },
  },
  {
    value: 'nextRun',
    text: t('scheduledWorkflow.nextRun'),
  },
  {
    value: 'location',
    text: 'Location',
  },
  {
    value: 'active',
    align: 'center',
    text: t('scheduledWorkflow.active'),
  },
  {
    value: 'action',
    text: '',
    sortable: false,
    align: 'right',
  },
];

const triggers = computed(() =>
  state.triggers.filter(({ name }) =>
    name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
  )
);

function scheduleText(data) {
  const text = {
    schedule: '',
    scheduleDetail: '',
  };

  switch (data.type) {
    case 'specific-day': {
      let rows = '';

      const days = data.days.map((item) => {
        const day = t(`workflow.blocks.trigger.days.${item.id}`);
        rows += `<tr><td>${day}</td> <td>${item.times.join(', ')}</td></tr>`;

        return day;
      });

      text.scheduleDetail = `<table><tbody>${rows}</tbody></table>`;
      text.schedule =
        data.days.length >= 6
          ? t('scheduledWorkflow.schedule.types.everyDay')
          : t('scheduledWorkflow.schedule.types.general', {
              time: days.join(', '),
            });
      break;
    }
    case 'interval':
      text.schedule = t('scheduledWorkflow.schedule.types.interval', {
        time: data.interval,
      });
      break;
    case 'date':
      text.schedule = dayjs(`${data.date}, ${data.time}`).format(
        'DD MMM YYYY, hh:mm:ss A'
      );
      break;
    default:
  }

  return text;
}
async function getTriggerObj(trigger, { id, name }) {
  if (!trigger || !scheduledTypes.includes(trigger.type)) return null;

  rowId += 1;
  const triggerObj = {
    name,
    id: rowId,
    nextRun: '-',
    schedule: '',
    active: false,
    type: trigger.type,
    workflowId: id,
  };

  try {
    const alarm = await browser.alarms.get(id);
    if (alarm) {
      triggerObj.active = true;
      triggerObj.nextRun = dayjs(alarm.scheduledTime).format(
        'DD MMM YYYY, hh:mm:ss A'
      );
    }

    triggersData[rowId] = {
      ...trigger,
      workflow: { id, name },
    };
    Object.assign(triggerObj, scheduleText(trigger));

    return triggerObj;
  } catch (error) {
    console.error(error);
    return null;
  }
}
async function refreshSchedule(id) {
  try {
    const triggerData = triggersData[id];
    if (!triggerData) return;

    await registerWorkflowTrigger(triggerData.workflow.id, {
      data: triggerData,
    });

    const triggerObj = await getTriggerObj(triggerData, triggerData.workflow);
    if (!triggerObj) return;

    const triggerIndex = state.triggers.findIndex(
      (trigger) => trigger.id === id
    );
    if (triggerIndex === -1) return;

    Object.assign(state.triggers[triggerIndex], triggerObj);
  } catch (error) {
    console.error(error);
  }
}
async function getWorkflowTrigger(workflow, { location, path }) {
  if (workflow.isDisabled) return;

  let { trigger } = workflow;

  if (!trigger) {
    const drawflow =
      typeof workflow.drawflow === 'string'
        ? JSON.parse(workflow.drawflow)
        : workflow.drawflow;
    trigger = findTriggerBlock(drawflow)?.data;
  }

  const obj = await getTriggerObj(trigger, workflow);

  if (obj) {
    obj.path = path;
    obj.location = location;
    state.triggers.push(obj);
  }
}
function iterateWorkflows({ workflows, path, location }) {
  const promises = workflows.map(async (workflow) => {
    const workflowPath = path(workflow);

    await getWorkflowTrigger(workflow, { path: workflowPath, location });
  });

  return Promise.allSettled(promises);
}

onMounted(async () => {
  try {
    await iterateWorkflows({
      location: 'Local',
      path: ({ id }) => `/workflows/${id}`,
      workflows: workflowStore.getWorkflows,
    });
    await iterateWorkflows({
      location: 'Hosted',
      workflows: hostedWorkflowStore.toArray,
      path: ({ id }) => `/workflows/${id}/hosted`,
    });

    const teamsObj = {};
    if (userStore.user?.teams) {
      userStore.user.teams.forEach((team) => {
        teamsObj[team.id] = team.name;
      });
    }

    Object.keys(teamWorkflowStore?.workflows || {}).forEach((teamId) => {
      const teamExist = objectHasKey(teamsObj);
      const teamName = teamsObj[teamId] ?? '(unknown)';

      iterateWorkflows({
        location: `Team: ${teamName.slice(0, 24)}`,
        workflows: teamWorkflowStore.getByTeam(teamId),
        path: ({ id }) =>
          teamExist ? null : `/teams/${teamId}/workflows/${id}`,
      });
    });
  } catch (error) {
    console.error(error);
  }
});
</script>
