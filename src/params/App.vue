<template>
  <div
    v-if="retrieved"
    class="mx-auto flex h-full w-full max-w-lg flex-col dark:text-gray-100"
  >
    <nav class="mb-4 flex w-full items-center border-b p-4">
      <span class="bg-box-transparent rounded-full p-1 dark:bg-none">
        <img src="@/assets/svg/logo.svg" class="w-10" />
      </span>
      <p class="ml-4 text-lg font-semibold">Automa</p>
    </nav>
    <div class="scroll flex-1 overflow-auto px-4 pb-4">
      <p class="my-4 text-gray-600 dark:text-gray-200">
        Input these workflows parameters before it runs.
      </p>
      <ui-expand
        v-for="(workflow, index) in sortedWorkflows"
        :key="index"
        :model-value="true"
        append-icon
        header-class="flex items-center text-left p-4 w-full rounded-lg"
        class="mb-4 rounded-lg bg-white dark:bg-gray-800"
      >
        <template #header>
          <ui-img
            v-if="workflow.data.icon?.startsWith('http')"
            :src="workflow.data.icon"
            class="overflow-hidden rounded-lg"
            style="height: 40px; width: 40px"
            alt="Can not display"
          />
          <span v-else class="bg-box-transparent rounded-lg p-2">
            <v-remixicon :name="workflow.data.icon" />
          </span>
          <div class="ml-4 ml-2 flex-1 overflow-hidden">
            <p class="text-overflow mr-4 leading-tight">
              {{ workflow.data.name }}
            </p>
            <p
              class="text-overflow leading-tight text-gray-600 dark:text-gray-200"
            >
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
                :autofocus="paramIdx === 0"
                :label="param.name + (param.data?.required ? '*' : '')"
                :param-data="param"
                class="w-full"
                @execute="
                  workflow.type === 'block'
                    ? continueWorkflow(index, workflow)
                    : runWorkflow(index, workflow)
                "
              />
              <ui-input
                v-else
                v-model="param.value"
                :type="param.inputType"
                :label="param.name + (param.data?.required ? '*' : '')"
                :placeholder="param.placeholder"
                class="w-full"
              />
              <p
                v-if="param.description"
                title="Description"
                class="ml-1 whitespace-pre text-sm leading-tight"
              >
                {{ param.description }}
              </p>
            </li>
          </ul>
          <div class="mt-6 flex items-center">
            <p>{{ dayjs(workflow.addedDate).fromNow() }}</p>
            <div class="grow" />
            <template v-if="workflow.type === 'block'">
              <ui-button
                class="mr-4"
                @click="cancelParamBlock(index, workflow, 'Canceled')"
              >
                Cancel
              </ui-button>
              <ui-button
                :disabled="!isValidParams(workflow.params)"
                variant="accent"
                @click="continueWorkflow(index, workflow)"
              >
                Continue
              </ui-button>
            </template>
            <template v-else>
              <ui-button class="mr-4" @click="deleteWorkflow(index)">
                Cancel
              </ui-button>
              <ui-button
                :disabled="!isValidParams(workflow.params)"
                variant="accent"
                @click="runWorkflow(index, workflow)"
              >
                <v-remixicon name="riPlayLine" class="mr-2 -ml-1" />
                Run
              </ui-button>
            </template>
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
import { parseJSON } from '@/utils/helper';
import ParameterInputValue from '@/components/newtab/workflow/edit/Parameter/ParameterInputValue.vue';
import ParameterJsonValue from '@/components/newtab/workflow/edit/Parameter/ParameterJsonValue.vue';

const paramsList = {
  string: {
    id: 'string',
    name: 'Input (string)',
    valueComp: ParameterInputValue,
  },
  json: {
    id: 'json',
    name: 'Input (JSON)',
    valueComp: ParameterJsonValue,
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
    json: (value) => parseJSON(value, null),
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
  /* eslint-disable-next-line */
  const isParamsValid = isValidParams(params);
  if (!isParamsValid) return;

  const variables = getParamsValues(params);
  let payload = {
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
  payload = isFirefox ? JSON.stringify(payload) : payload;

  browser.runtime
    .sendMessage(payload)
    .then(() => {
      deleteWorkflow(index);
    })
    .catch((error) => {
      console.error(error);
    });
}
function cancelParamBlock(index, { data }, message) {
  browser.storage.local
    .set({
      [data.promptId]: {
        message,
        $isError: true,
      },
    })
    .then(() => {
      deleteWorkflow(index);
    });
}
function continueWorkflow(index, { data, params }) {
  /* eslint-disable-next-line */
  const isParamsValid = isValidParams(params);
  if (!isParamsValid) return;

  const timeout = data.timeoutMs > 0 ? Date.now() > data.timeout : false;

  browser.storage.local
    .set({
      [data.promptId]: timeout ? { $timeout: true } : getParamsValues(params),
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

  return isValid;
}

let checkTimeout = null;

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

    if (!checkTimeout) {
      checkTimeout = setInterval(() => {
        workflows.value.forEach((workflow, index) => {
          if (
            workflow.type !== 'block' ||
            Date.now() < workflow.data.timeout ||
            workflow.data.timeoutMs <= 0
          )
            return;

          cancelParamBlock(index, workflow, 'Timeout');
        });
      }, 1000);
    }
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
