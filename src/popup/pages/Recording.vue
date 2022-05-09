<template>
  <div class="p-5">
    <div class="flex items-center">
      <button
        v-tooltip="t('recording.stop')"
        class="h-12 w-12 rounded-full focus:ring-0 bg-red-400 relative flex items-center justify-center"
        @click="stopRecording"
      >
        <span
          class="absolute animate-ping bg-red-400 rounded-full"
          style="height: 80%; width: 80%; animation-duration: 1.3s"
        ></span>
        <ui-spinner v-if="state.isGenerating" color="text-white" />
        <v-remixicon v-else name="riStopLine" class="z-10 relative" />
      </button>
      <div class="ml-4 flex-1 overflow-hidden">
        <p class="text-sm">{{ t('recording.title') }}</p>
        <p class="font-semibold text-xl leading-tight text-overflow">
          {{ state.name }}
        </p>
      </div>
    </div>
    <p class="font-semibold mt-6 mb-2">Flows</p>
    <ui-list class="space-y-1">
      <ui-list-item
        v-for="(item, index) in state.flows"
        :key="index"
        class="group"
        small
      >
        <v-remixicon :name="tasks[item.id].icon" />
        <div class="overflow-hidden flex-1 mx-2">
          <p class="leading-tight">
            {{ t(`workflow.blocks.${item.id}.name`) }}
          </p>
          <p
            :title="item.data.description || item.description"
            class="text-overflow text-sm leading-tight text-gray-600"
          >
            {{ item.data.description || item.description }}
          </p>
        </div>
        <v-remixicon
          name="riDeleteBin7Line"
          class="invisible group-hover:visible cursor-pointer"
          @click="removeBlock(index)"
        />
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
import { onMounted, reactive, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { nanoid } from 'nanoid';
import defu from 'defu';
import browser from 'webextension-polyfill';
import { tasks } from '@/utils/shared';
import Workflow from '@/models/workflow';

const { t } = useI18n();
const router = useRouter();

const state = reactive({
  name: '',
  flows: [],
  activeTab: {},
  isGenerating: false,
});

function generateDrawflow(startBlock, startBlockData) {
  let nextNodeId = nanoid();
  const triggerId = startBlock.id || nanoid();
  let prevNodeId = startBlock.id || triggerId;

  const nodes = {
    [triggerId]: {
      pos_x: 50,
      pos_y: 300,
      inputs: {},
      outputs: {
        [startBlock ? startBlock.output : 'output_1']: {
          connections: [{ node: nextNodeId, output: 'input_1' }],
        },
      },
      id: triggerId,
      typenode: 'vue',
      name: 'trigger',
      class: 'trigger',
      html: 'BlockBasic',
      data: tasks.trigger.data,
      ...startBlockData,
    },
  };

  const position = {
    y: startBlockData ? startBlockData.pos_y + 50 : 300,
    x: startBlockData ? startBlockData.pos_x + 120 : 260,
  };

  state.flows.forEach((block, index) => {
    const node = {
      id: nextNodeId,
      name: block.id,
      class: block.id,
      typenode: 'vue',
      pos_x: position.x,
      pos_y: position.y,
      inputs: { input_1: { connections: [] } },
      outputs: { output_1: { connections: [] } },
      html: tasks[block.id].component,
      data: defu(block.data, tasks[block.id].data),
    };

    node.inputs.input_1.connections.push({
      node: prevNodeId,
      input: index === 0 && startBlock ? startBlock.output : 'output_1',
    });

    const isLastIndex = index === state.flows.length - 1;

    prevNodeId = nextNodeId;
    nextNodeId = nanoid();

    if (!isLastIndex) {
      node.outputs.output_1.connections.push({
        node: nextNodeId,
        output: 'input_1',
      });
    }

    const inNewRow = (index + 1) % 5 === 0;
    const blockNameLen = tasks[block.id].name.length * 14 + 120;
    position.x = inNewRow ? 50 : position.x + blockNameLen;
    position.y = inNewRow ? position.y + 150 : position.y;

    nodes[node.id] = node;
  });

  if (startBlock) return nodes;

  return { drawflow: { Home: { data: nodes } } };
}
async function stopRecording() {
  if (state.isGenerating) return;
  if (state.flows.length === 0) {
    router.push('/');
    return;
  }

  try {
    state.isGenerating = true;

    if (state.workflowId) {
      const workflow = Workflow.find(state.workflowId);
      const drawflow =
        typeof workflow.drawflow === 'string'
          ? JSON.parse(workflow.drawflow)
          : workflow.drawflow;
      const node = drawflow.drawflow.Home.data[state.connectFrom.id];
      const updatedDrawflow = generateDrawflow(state.connectFrom, node);

      Object.assign(drawflow.drawflow.Home.data, updatedDrawflow);

      await Workflow.update({
        where: state.workflowId,
        data: {
          drawflow: JSON.stringify(drawflow),
        },
      });
    } else {
      const drawflow = generateDrawflow();
      await Workflow.insert({
        data: {
          name: state.name,
          drawflow: JSON.stringify(drawflow),
        },
      });
    }

    await browser.storage.local.remove(['isRecording', 'recording']);
    await browser.browserAction.setBadgeText({ text: '' });

    const tabs = (await browser.tabs.query({})).filter((tab) =>
      tab.url.startsWith('http')
    );
    Promise.allSettled(
      tabs.map(({ id }) =>
        browser.tabs.sendMessage(id, { type: 'recording:stop' })
      )
    );

    state.isGenerating = false;

    router.push('/');
  } catch (error) {
    state.isGenerating = false;
    console.error(error);
  }
}
function removeBlock(index) {
  state.flows.splice(index, 1);

  browser.storage.local.set({ recording: toRaw(state) });
}

onMounted(async () => {
  const { recording, isRecording } = await browser.storage.local.get([
    'recording',
    'isRecording',
  ]);

  if (!isRecording && !recording) return;

  Object.assign(state, recording);
});
</script>
