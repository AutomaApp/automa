<template>
  <div
    v-if="retrieved"
    class="w-full flex flex-col h-full max-w-lg mx-auto dark:text-gray-100"
  >
    <nav class="flex items-center w-full p-4 border-b mb-4">
      <span class="p-1 rounded-full bg-box-transparent dark:bg-none">
        <img src="@/assets/svg/logo.svg" class="w-10" />
      </span>
      <p class="font-semibold text-lg ml-4">Automa</p>
    </nav>
    <div class="px-4 pb-4 flex-1 overflow-auto scroll">
      <p class="text-gray-600 my-4 dark:text-gray-200">
        Input these workflows parameters before it runs.
      </p>
      <ui-expand
        v-for="(workflow, index) in sortedWorkflows"
        :key="index"
        :model-value="true"
        append-icon
        header-class="flex items-center text-left p-4 w-full rounded-lg"
        class="bg-white mb-4 dark:bg-gray-800 rounded-lg"
      >
        <template #header>
          <ui-img
            v-if="workflow.data.icon?.startsWith('http')"
            :src="workflow.data.icon"
            class="overflow-hidden rounded-lg"
            style="height: 40px; width: 40px"
            alt="Can not display"
          />
          <span v-else class="p-2 rounded-lg bg-box-transparent">
            <v-remixicon :name="workflow.data.icon" />
          </span>
          <div class="ml-4 flex-1 ml-2 overflow-hidden">
            <p
              class="text-overflow leading-tight mr-4 text-gray-600 dark:text-gray-200"
            >
              {{ workflow.data.name }}
            </p>
            <p class="leading-tight text-overflow">
              {{ workflow.data.description }}
            </p>
          </div>
        </template>
        <p v-if="workflow.type === 'block'" class="px-4 pb-2">
          By Parameter Prompt block
        </p>
        <div class="px-4 pb-4">
          <ul class="space-y-4 divide-y">
            <li v-for="(param, paramIdx) in workflow.params" :key="paramIdx">
              <component
                :is="paramsList[param.type].valueComp"
                v-if="paramsList[param.type]"
                v-model="param.value"
                :label="param.name + (param.data.required ? '*' : '')"
                :param-data="param"
                class="w-full"
              />
              <ui-input
                v-else
                v-model="param.value"
                :type="param.inputType"
                :label="param.name + (param.data.required ? '*' : '')"
                :placeholder="param.placeholder"
                class="w-full"
              />
              <p
                v-if="param.description"
                title="Description"
                class="ml-1 text-sm"
              >
                {{ param.description }}
              </p>
            </li>
          </ul>
          <div class="flex items-center mt-6">
            <p>{{ dayjs(workflow.addedDate).fromNow() }}</p>
            <div class="flex-grow" />
            <ui-button class="mr-4" @click="deleteWorkflow(index)">
              Cancel
            </ui-button>
            <ui-button
              v-if="workflow.type === 'block'"
              :disabled="!isValidParams(workflow.params)"
              variant="accent"
              @click="continueWorkflow(index, workflow)"
            >
              Continue
            </ui-button>
            <ui-button
              v-else
              :disabled="!isValidParams(workflow.params)"
              variant="accent"
              @click="runWorkflow(index, workflow)"
            >
              <v-remixicon name="riPlayLine" class="mr-2 -ml-1" />
              Run
            </ui-button>
          </div>
        </div>
      </ui-expand>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, computed } from 'vue';
import browser from 'webextension-polyfill';
import workflowParameters from '@business/parameters';
import automa from '@business';
import { useTheme } from '@/composable/theme';
import dayjs from '@/lib/dayjs';
import ParameterInputValue from '@/components/newtab/workflow/edit/Parameter/ParameterInputValue.vue';

const paramsList = {
  string: {
    id: 'string',
    name: 'Input (string)',
    valueComp: ParameterInputValue,
  },
};

const theme = useTheme();
theme.init();

const retrieved = ref(false);
const workflows = ref([]);

const sortedWorkflows = computed(() =>
  workflows.value.slice().sort((a, b) => b.addedDate - a.addedDate)
);

const flattenTeamWorkflows = (items) => Object.values(Object.values(items)[0]);

async function findWorkflow(workflowId) {
  if (!workflowId) return null;

  if (workflowId.startsWith('team')) {
    const { teamWorkflows } = await browser.storage.local.get('teamWorkflows');
    if (!teamWorkflows) return null;

    const teamWorkflowsArr = flattenTeamWorkflows(teamWorkflows);

    return teamWorkflowsArr.find((item) => item.id === workflowId);
  }

  const { workflows: localWorkflows, workflowHosts } =
    await browser.storage.local.get(['workflows', 'workflowHosts']);
  let workflow = Array.isArray(localWorkflows)
    ? localWorkflows.find(({ id }) => id === workflowId)
    : localWorkflows[workflowId];

  if (!workflow) {
    workflow = Object.values(workflowHosts || {}).find(
      ({ hostId }) => hostId === workflowId
    );

    if (workflow) workflow.id = workflow.hostId;
  }

  return workflow;
}
function deleteWorkflow(index) {
  workflows.value.splice(index, 1);

  if (workflows.value.length === 0) {
    window.close();
  }
}
async function addWorkflow(workflowId) {
  try {
    const workflow =
      typeof workflowId === 'string'
        ? await findWorkflow(workflowId)
        : workflowId;
    const triggerBlock = workflow.drawflow.nodes.find(
      (node) => node.label === 'trigger'
    );
    if (!triggerBlock) return;

    const params = triggerBlock.data.parameters.map((param) => ({
      ...param,
      value: param.defaultValue,
      inputType: param.type === 'string' ? 'text' : 'number',
    }));

    workflows.value.push({
      params,
      data: workflow,
      addedDate: Date.now(),
    });
  } catch (error) {
    console.error(error);
  }
}
function getParamsValues(params) {
  const getParamVal = {
    string: (str) => str,
    number: (num) => (Number.isNaN(+num) ? 0 : +num),
    default: (value) => value,
  };

  return params.reduce((acc, param) => {
    const valueFunc =
      getParamVal[param.type] ||
      paramsList[param.type]?.getValue ||
      getParamVal.default;
    const value = valueFunc(param.value || param.defaultValue);
    acc[param.name] = value;

    return acc;
  }, {});
}
function runWorkflow(index, { data, params }) {
  const variables = getParamsValues(params);
  const payload = {
    name: 'background--workflow:execute',
    data: {
      ...data,
      options: {
        checkParams: false,
        data: { variables },
      },
    },
  };
  const isFirefox = BROWSER_TYPE === 'firefox';

  browser.runtime
    .sendMessage(isFirefox ? JSON.stringify(payload) : payload)
    .then(() => {
      deleteWorkflow(index);
    });
}
function continueWorkflow(index, { data, params }) {
  if (Date.now() > data.timeout) {
    deleteWorkflow(index);
    return;
  }

  const key = `params-prompt:${data.execId}__${data.blockId}`;
  browser.storage.local
    .set({
      [key]: getParamsValues(params),
    })
    .then(() => {
      deleteWorkflow(index);
    });
}
function isValidParams(params) {
  const isValid = params.every((param) => {
    if (!param.data?.required) return true;

    return param.value;
  });
  console.log(isValid);
  return isValid;
}

browser.runtime.onMessage.addListener(({ name, data }) => {
  if (name === 'workflow:params') {
    addWorkflow(data);
  } else if (name === 'workflow:params-block') {
    const params = [...data.params];
    delete data.params;

    workflows.value.push({
      data,
      params,
      type: 'block',
      addedDate: Date.now(),
    });
  }
});

onMounted(async () => {
  try {
    const query = new URLSearchParams(window.location.search);
    const workflowId = query.get('workflowId');

    if (workflowId) addWorkflow(workflowId);
    await automa('content');

    Object.assign(paramsList, workflowParameters());
  } catch (error) {
    // Do nothing
  } finally {
    retrieved.value = true;
  }
});
</script>
