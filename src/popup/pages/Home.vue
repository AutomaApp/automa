<template>
  <div class="bg-accent rounded-b-2xl absolute top-0 left-0 h-32 w-full"></div>
  <div
    class="flex dark placeholder-black text-white px-5 pt-8 mb-6 items-center"
  >
    <ui-input
      v-model="query"
      :placeholder="`${t('common.search')}...`"
      autofocus
      prepend-icon="riSearch2Line"
      class="flex-1 search-input"
    ></ui-input>
    <ui-button
      v-tooltip="t(`home.elementSelector.${haveAccess ? 'name' : 'noAccess'}`)"
      icon
      class="ml-3"
      @click="selectElement"
    >
      <v-remixicon name="riFocus3Line" />
    </ui-button>
    <ui-button
      icon
      :title="t('common.dashboard')"
      class="ml-3"
      @click="openDashboard"
    >
      <v-remixicon name="riHome5Line" />
    </ui-button>
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
import { sendMessage } from '@/utils/message';
import Workflow from '@/models/workflow';
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard.vue';

const { t } = useI18n();
const dialog = useDialog();

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
function renameWorkflow({ id, name }) {
  dialog.prompt({
    title: t('home.workflow.rename'),
    placeholder: t('common.name'),
    okText: t('common.rename'),
    inputValue: name,
    onConfirm: (newName) => {
      Workflow.update({
        where: id,
        data: {
          name: newName,
        },
      });
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
  const tabOptions = {
    active: true,
    url: browser.runtime.getURL(
      `/newtab.html#${typeof url === 'string' ? url : ''}`
    ),
  };

  browser.tabs
    .query({ url: browser.runtime.getURL('/newtab.html') })
    .then(([tab]) => {
      if (tab) {
        browser.tabs.update(tab.id, tabOptions).then(() => {
          browser.tabs.reload(tab.id);
        });
      } else {
        browser.tabs.create(tabOptions);
      }
    });
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

onMounted(async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  haveAccess.value = /^(https?)/.test(tab.url);
});
</script>
