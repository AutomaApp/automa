<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-12 capitalize">
      {{ t('scheduledWorkflow.title', 2) }}
    </h1>
    <div class="flex items-center">
      <ui-input
        v-model="state.query"
        prepend-icon="riSearch2Line"
        :placeholder="t('common.search')"
      />
      <div class="flex-grow" />
      <ui-button @click="scheduleState.showModal = true">
        <v-remixicon name="riAddLine" class="-ml mr-2" />
        Schedule workflow
      </ui-button>
    </div>
    <ui-table
      :headers="tableHeaders"
      :items="triggers"
      item-key="id"
      class="w-full mt-8"
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
    <ui-modal
      v-model="scheduleState.showModal"
      title="Workflow Triggers"
      persist
      content-class="max-w-2xl"
    >
      <template #header-append>
        <div>
          <ui-button @click="clearAddWorkflowSchedule">
            {{ t('common.cancel') }}
          </ui-button>
          <ui-button
            class="ml-4"
            variant="accent"
            @click="updateWorkflowTrigger"
          >
            {{ t('common.save') }}
          </ui-button>
        </div>
      </template>
      <ui-autocomplete
        v-if="!scheduleState.selectedWorkflow.id"
        :model-value="scheduleState.selectedWorkflow.query"
        :items="workflowStore.getWorkflows"
        block
        class="mt-2"
        item-key="id"
        item-label="name"
        @selected="onSelectedWorkflow"
      >
        <ui-input
          v-model="scheduleState.selectedWorkflow.query"
          class="w-full"
          autocomplete="off"
          placeholder="Search workflow"
        />
      </ui-autocomplete>
      <template v-else>
        <p class="font-semibold">
          {{ scheduleState.selectedWorkflow.name }}
        </p>
        <shared-workflow-triggers
          :key="scheduleState.selectedWorkflow.id"
          v-model:triggers="scheduleState.selectedWorkflow.triggers"
          :exclude="[
            'context-menu',
            'on-startup',
            'visit-web',
            'keyboard-shortcut',
          ]"
          class="mt-4"
        />
      </template>
    </ui-modal>
  </div>
</template>
<script setup>
import { onMounted, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import cloneDeep from 'lodash.clonedeep';
import browser from 'webextension-polyfill';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { findTriggerBlock, objectHasKey } from '@/utils/helper';
import {
  registerWorkflowTrigger,
  workflowTriggersMap,
} from '@/utils/workflowTrigger';
import SharedWorkflowTriggers from '@/components/newtab/shared/SharedWorkflowTriggers.vue';

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
const scheduleState = reactive({
  query: '',
  showModal: false,
  selectedWorkflow: {
    id: '',
    name: '',
    triggers: [],
  },
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
async function getTriggersData(triggerData, { id, name }) {
  try {
    const alarms = await browser.alarms.getAll();
    const getTrigger = async (trigger) => {
      try {
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
          triggerId: trigger.id || null,
        };

        const alarm = alarms.find((alarmItem) => {
          if (trigger.id) return alarmItem.name.includes(trigger.id);

          return alarmItem.name.includes(id);
        });
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
        return null;
      }
    };

    if (triggerData.triggers) {
      const result = await Promise.all(
        triggerData.triggers.map((trigger) => {
          const triggerItemData = { ...trigger };
          Object.assign(triggerItemData, triggerItemData.data);

          delete triggerItemData.data;

          return getTrigger(triggerItemData);
        })
      );

      return result.reduce((acc, item) => {
        if (item) {
          acc.push(item);
        }

        return acc;
      }, []);
    }
    const result = await getTrigger(triggerData);
    if (!result) return [];

    return [result];
  } catch (error) {
    console.error(error);
    return [];
  }
}
async function refreshSchedule(id) {
  try {
    const triggerData = triggersData[id] ? cloneDeep(triggersData[id]) : null;
    if (!triggerData) return;

    const handler = workflowTriggersMap[triggerData.type];
    if (!handler) return;

    if (triggerData.id) {
      triggerData.workflow.id = `trigger:${triggerData.workflow.id}:${triggerData.id}`;
    }

    await registerWorkflowTrigger(triggerData.workflow.id, {
      data: triggerData,
    });

    const [triggerObj] = await getTriggersData(
      triggerData,
      triggerData.workflow
    );
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

  const triggersList = await getTriggersData(trigger, workflow);
  if (triggersList.length !== 0) {
    triggersList.forEach((triggerData) => {
      triggerData.path = path;
      triggerData.location = location;
      state.triggers.push(triggerData);
    });
  }
}
function iterateWorkflows({ workflows, path, location }) {
  const promises = workflows.map(async (workflow) => {
    const workflowPath = path(workflow);

    await getWorkflowTrigger(workflow, { path: workflowPath, location });
  });

  return Promise.allSettled(promises);
}
function onSelectedWorkflow({ item }) {
  if (!item.drawflow?.nodes) return;

  const triggerBlock = findTriggerBlock(item.drawflow);
  if (!triggerBlock) return;

  let { triggersList } = triggerBlock.data;
  if (!triggersList) {
    triggersList = [
      {
        data: { ...triggerBlock.data },
        type: triggerBlock.data.type,
        id: nanoid(5),
      },
    ];
  }

  scheduleState.selectedWorkflow.id = item.id;
  scheduleState.selectedWorkflow.name = item.name;
  scheduleState.selectedWorkflow.triggers = [...triggersList];
}
function clearAddWorkflowSchedule() {
  Object.assign(scheduleState, {
    query: '',
    showModal: false,
    selectedWorkflow: {
      id: '',
      name: '',
      triggers: [],
    },
  });
}
async function updateWorkflowTrigger() {
  try {
    const {
      triggers: workflowTriggers,
      id,
      name,
    } = scheduleState.selectedWorkflow;
    const workflowData = workflowStore.getById(id);
    if (!workflowData || !workflowData?.drawflow?.nodes) return;

    const triggerBlockIndex = workflowData.drawflow.nodes.findIndex(
      (node) => node.label === 'trigger'
    );
    if (triggerBlockIndex === -1) return;

    const copyNodes = [...workflowData.drawflow.nodes];
    copyNodes[triggerBlockIndex].data.triggers = cloneDeep(workflowTriggers);
    await workflowStore.update({
      id,
      data: {
        trigger: { triggers: workflowTriggers },
        drawflow: {
          ...workflowData.drawflow,
          nodes: copyNodes,
        },
      },
    });

    state.triggers = state.triggers.filter((trigger) => {
      const isNotMatch =
        scheduleState.selectedWorkflow.id !== trigger.workflowId;
      if (!isNotMatch) {
        delete triggersData[trigger.id];
      }

      return isNotMatch;
    });

    await registerWorkflowTrigger(id, {
      data: { triggers: workflowTriggers },
    });

    const triggersList = await getTriggersData(
      { triggers: workflowTriggers },
      { id, name }
    );
    if (triggersList.length !== 0) {
      triggersList.forEach((triggerData) => {
        triggerData.location = 'Local';
        triggerData.path = `/workflows/${id}`;
        state.triggers.push(triggerData);
      });
    }

    clearAddWorkflowSchedule();
  } catch (error) {
    console.error(error);
  }
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
