<template>
  <div class="bg-accent rounded-b-2xl absolute top-0 left-0 h-48 w-full"></div>
  <div class="dark placeholder-black relative z-10 text-white px-5 pt-8 mb-6">
    <div class="flex items-center mb-4">
      <h1 class="text-xl font-semibold text-white">Automa</h1>
      <div class="flex-grow"></div>
      <ui-button
        v-tooltip.group="t('home.record.title')"
        icon
        class="mr-2"
        @click="recordWorkflow"
      >
        <v-remixicon name="riRecordCircleLine" />
      </ui-button>
      <ui-button
        v-tooltip.group="
          t(`home.elementSelector.${haveAccess ? 'name' : 'noAccess'}`)
        "
        icon
        class="mr-2"
        @click="selectElement"
      >
        <v-remixicon name="riFocus3Line" />
      </ui-button>
      <ui-button
        v-tooltip.group="t('common.dashboard')"
        icon
        :title="t('common.dashboard')"
        @click="openDashboard"
      >
        <v-remixicon name="riHome5Line" />
      </ui-button>
    </div>
    <div class="flex">
      <ui-input
        v-model="query"
        :placeholder="`${t('common.search')}...`"
        prepend-icon="riSearch2Line"
        class="w-full search-input"
      />
    </div>
  </div>
  <div class="px-5 pb-5 space-y-2">
    <ui-card v-if="Workflow.all().length === 0" class="text-center">
      <img src="@/assets/svg/alien.svg" />
      <p class="font-semibold">{{ t('message.empty') }}</p>
      <ui-button
        variant="accent"
        class="mt-6"
        @click="openDashboard('/workflows')"
      >
        {{ t('home.workflow.new') }}
      </ui-button>
    </ui-card>
    <home-workflow-card
      v-for="workflow in workflows"
      :key="workflow.id"
      :workflow="workflow"
      @details="openDashboard(`/workflows/${$event.id}`)"
      @update="updateWorkflow(workflow.id, $event)"
      @execute="executeWorkflow"
      @rename="renameWorkflow"
      @delete="deleteWorkflow"
    />
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import { useDialog } from '@/composable/dialog';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { sendMessage } from '@/utils/message';
import Workflow from '@/models/workflow';
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard.vue';

const { t } = useI18n();
const dialog = useDialog();

useGroupTooltip();

const query = ref('');
const haveAccess = ref(true);

const workflows = computed(() =>
  Workflow.query()
    .where(({ name }) =>
      name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    )
    .orderBy('createdAt', 'desc')
    .get()
);

function executeWorkflow(workflow) {
  sendMessage('workflow:execute', workflow, 'background');
}
function updateWorkflow(id, data) {
  return Workflow.update({
    where: id,
    data,
  });
}
function renameWorkflow({ id, name }) {
  dialog.prompt({
    title: t('home.workflow.rename'),
    placeholder: t('common.name'),
    okText: t('common.rename'),
    inputValue: name,
    onConfirm: (newName) => {
      updateWorkflow(id, { name: newName });
    },
  });
}
function deleteWorkflow({ id, name }) {
  dialog.confirm({
    title: t('home.workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name }),
    onConfirm: () => {
      Workflow.delete(id);
    },
  });
}
function openDashboard(url) {
  sendMessage('open:dashboard', url, 'background');
}
async function selectElement() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  try {
    await browser.tabs.sendMessage(tab.id, {
      type: 'content-script-exists',
    });

    browser.tabs.sendMessage(tab.id, {
      type: 'select-element',
    });
  } catch (error) {
    if (error.message.includes('Could not establish connection.')) {
      await browser.tabs.executeScript(tab.id, {
        allFrames: true,
        file: './contentScript.bundle.js',
      });

      selectElement();
    }

    console.error(error);
  }
}
function recordWorkflow() {
  dialog.prompt({
    title: t('home.record.title'),
    okText: t('home.record.button'),
    placeholder: t('home.record.name'),
    onConfirm: async (name) => {
      const flows = [];
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (activeTab && activeTab.url.startsWith('http')) {
        flows.push({
          id: 'new-tab',
          description: activeTab.url,
          data: { url: activeTab.url },
        });
      }

      await browser.storage.local.set({
        isRecording: true,
        recording: {
          flows,
          activeTab: {
            id: activeTab.id,
            url: activeTab.url,
          },
          name: name || 'unnamed',
        },
      });
      await browser.browserAction.setBadgeBackgroundColor({ color: '#ef4444' });
      await browser.browserAction.setBadgeText({ text: 'rec' });

      const tabs = (await browser.tabs.query({})).filter(({ url }) =>
        url.startsWith('http')
      );
      await Promise.allSettled(
        tabs.map(({ id }) =>
          browser.tabs.executeScript(id, {
            file: 'recordWorkflow.bundle.js',
          })
        )
      );

      window.close();
    },
  });
}

onMounted(async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  haveAccess.value = /^(https?)/.test(tab.url);
});
</script>
