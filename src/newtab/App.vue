<template>
  <template v-if="retrieved">
    <app-sidebar v-if="$route.name !== 'recording'" />
    <main :class="{ 'pl-16': $route.name !== 'recording' }">
      <router-view />
    </main>
    <app-logs />
    <ui-dialog>
      <template #auth>
        <div class="text-center">
          <p class="text-xl font-semibold">Oops!! 😬</p>
          <p class="mt-2 text-gray-600 dark:text-gray-200">
            {{ t('auth.text') }}
          </p>
          <ui-button
            tag="a"
            href="https://www.automa.site/auth"
            class="mt-6 block w-full"
            variant="accent"
          >
            {{ t('auth.signIn') }}
          </ui-button>
        </div>
      </template>
    </ui-dialog>
    <div
      v-if="isUpdated"
      class="fixed bottom-8 left-1/2 z-50 max-w-xl -translate-x-1/2 text-white dark:text-gray-900"
    >
      <div class="flex items-center rounded-lg bg-accent p-4 shadow-2xl">
        <v-remixicon name="riInformationLine" class="mr-3" />
        <p>
          {{ t('updateMessage.text1', { version: currentVersion }) }}
        </p>
        <a
          :href="`https://github.com/AutomaApp/automa/releases/latest`"
          target="_blank"
          rel="noopener"
          class="ml-1 underline"
        >
          {{ t('updateMessage.text2') }}
        </a>
        <div class="flex-1" />
        <button
          class="ml-6 text-gray-200 dark:text-gray-600"
          @click="isUpdated = false"
        >
          <v-remixicon size="20" name="riCloseLine" />
        </button>
      </div>
      <div class="mt-4 flex items-center rounded-lg bg-accent p-4 shadow-2xl">
        <v-remixicon name="riInformationLine" class="mr-3 shrink-0" />
        <p>
          Export your Automa workflows as a standalone extension using
          <a
            href="https://docs.automa.site/extension-builder/"
            target="_blank"
            class="underline"
            >Automa Chrome Extension Builder</a
          >
        </p>
      </div>
    </div>
    <shared-permissions-modal
      v-model="permissionState.showModal"
      :permissions="permissionState.items"
    />
  </template>
  <div v-else class="py-8 text-center">
    <ui-spinner color="text-accent" size="28" />
  </div>
</template>
<script setup>
import { ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { compare } from 'compare-versions';
import { useHead } from '@vueuse/head';
import browser from 'webextension-polyfill';
import { useStore } from '@/stores/main';
import { useUserStore } from '@/stores/user';
import { useFolderStore } from '@/stores/folder';
import { usePackageStore } from '@/stores/package';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useTheme } from '@/composable/theme';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vueI18n';
import { getUserWorkflows } from '@/utils/api';
import { getWorkflowPermissions } from '@/utils/workflowData';
import { sendMessage } from '@/utils/message';
import { workflowState, startWorkflowExec } from '@/workflowEngine';
import emitter from '@/lib/mitt';
import automa from '@business';
import dbLogs from '@/db/logs';
import dayjs from '@/lib/dayjs';
import AppLogs from '@/components/newtab/app/AppLogs.vue';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';
import dataMigration from '@/utils/dataMigration';
import iconFirefox from '@/assets/svg/logoFirefox.svg';
import iconChrome from '@/assets/svg/logo.svg';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal.vue';

const iconElement = document.createElement('link');
iconElement.rel = 'icon';
iconElement.href =
  window.location.protocol === 'moz-extension' ? iconFirefox : iconChrome;
document.head.appendChild(iconElement);

window.fromBackground = window.location.href.includes('?fromBackground=true');

const { t } = useI18n();
const route = useRoute();
const store = useStore();
const theme = useTheme();
const router = useRouter();
const userStore = useUserStore();
const folderStore = useFolderStore();
const packageStore = usePackageStore();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();
const sharedWorkflowStore = useSharedWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();

theme.init();

const retrieved = ref(false);
const isUpdated = ref(false);
const permissionState = reactive({
  permissions: [],
  showModal: false,
});

const currentVersion = browser.runtime.getManifest().version;
const prevVersion = localStorage.getItem('ext-version') || '0.0.0';

async function fetchUserData() {
  try {
    if (!userStore.user) return;

    const { backup, hosted } = await getUserWorkflows();
    userStore.hostedWorkflows = hosted || {};

    if (backup && backup.length > 0) {
      const { lastBackup } = browser.storage.local.get('lastBackup');
      if (!lastBackup) {
        const backupIds = backup.map(({ id }) => id);

        userStore.backupIds = backupIds;
        await browser.storage.local.set({
          backupIds,
          lastBackup: new Date().toISOString(),
        });
      }

      await workflowStore.insertOrUpdate(backup, { checkUpdateDate: true });
    }

    userStore.retrieved = true;
  } catch (error) {
    console.error(error);
  }
}
/* eslint-disable-next-line */
function autoDeleteLogs() {
  const deleteAfter = store.settings.deleteLogAfter;
  if (deleteAfter === 'never') return;

  const lastCheck =
    +localStorage.getItem('checkDeleteLogs') || Date.now() - 8.64e7;
  const dayDiff = dayjs().diff(dayjs(lastCheck), 'day');

  if (dayDiff < 1) return;

  const aDayInMs = 8.64e7;
  const maxLogAge = Date.now() - aDayInMs * deleteAfter;

  dbLogs.items
    .where('endedAt')
    .below(maxLogAge)
    .toArray()
    .then((values) => {
      const ids = values.map(({ id }) => id);

      dbLogs.items.bulkDelete(ids);
      dbLogs.ctxData.where('logId').anyOf(ids).delete();
      dbLogs.logsData.where('logId').anyOf(ids).delete();
      dbLogs.histories.where('logId').anyOf(ids).delete();

      localStorage.setItem('checkDeleteLogs', Date.now());
    });
}
async function syncHostedWorkflows() {
  const hostIds = [];
  const userHosted = userStore.getHostedWorkflows;
  const hostedWorkflows = hostedWorkflowStore.workflows;

  Object.keys(hostedWorkflows).forEach((hostId) => {
    const isItsOwn = userHosted.find((item) => item.hostId === hostId);
    if (isItsOwn) return;

    hostIds.push({ hostId, updatedAt: hostedWorkflows[hostId].updatedAt });
  });

  if (hostIds.length === 0) return;

  await hostedWorkflowStore.fetchWorkflows(hostIds);
}
function stopRecording() {
  if (!window.stopRecording) return;

  window.stopRecording();
}

const messageEvents = {
  'refresh-packages': function () {
    packageStore.loadData(true);
  },
  'open-logs': function (data) {
    emitter.emit('ui:logs', {
      show: true,
      logId: data.logId,
    });
  },
  'workflow:added': function (data) {
    if (data.source === 'team') {
      teamWorkflowStore.loadData().then(() => {
        router.push(
          `/teams/${data.teamId}/workflows/${data.workflowId}?permission=true`
        );
      });
    } else if (data.workflowData) {
      workflowStore
        .insert(data.workflowData, { duplicateId: true })
        .then(async () => {
          try {
            const permissions = await getWorkflowPermissions(data.workflowData);
            if (permissions.length === 0) return;

            permissionState.items = permissions;
            permissionState.showModal = true;
          } catch (error) {
            console.error(error);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  },
  'workflow:execute': function ({ data, options }) {
    startWorkflowExec(data, options ?? data?.options ?? {});
  },
  'recording:stop': stopRecording,
  'background--recording:stop': stopRecording,
};

browser.runtime.onMessage.addListener(({ type, data }) => {
  if (!type || !messageEvents[type]) return;

  messageEvents[type](data);
});

browser.storage.local.onChanged.addListener(({ workflowStates }) => {
  if (!workflowStates) return;

  const states = Object.values(workflowStates.newValue);
  workflowStore.states = states;
});

useHead(() => {
  const runningWorkflows = workflowStore.popupStates.length;

  return {
    title: 'Dashboard',
    titleTemplate:
      runningWorkflows > 0
        ? `%s (${runningWorkflows} Workflows Running) - Automa`
        : '%s - Automa',
  };
});

/* eslint-disable-next-line */
window.onbeforeunload = () => {
  const runningWorkflows = workflowStore.popupStates.length;
  if (window.isDataChanged || runningWorkflows > 0) {
    return t('message.notSaved');
  }
};
window.addEventListener('message', ({ data }) => {
  if (data?.type !== 'automa-fetch') return;

  const sendResponse = (result) => {
    const sandbox = document.getElementById('sandbox');
    sandbox.contentWindow.postMessage(
      {
        type: 'fetchResponse',
        data: result,
        id: data.data.id,
      },
      '*'
    );
  };

  sendMessage('fetch', data.data, 'background')
    .then((result) => {
      sendResponse({ isError: false, result });
    })
    .catch((error) => {
      sendResponse({ isError: true, result: error.message });
    });
});

watch(
  () => workflowStore.popupStates,
  () => {
    if (
      !window.fromBackground ||
      workflowStore.popupStates.length !== 0 ||
      route.name !== 'workflows'
    )
      return;

    window.close();
  }
);

(async () => {
  try {
    workflowState.storage = {
      get() {
        return workflowStore.popupStates;
      },
      set(key, value) {
        workflowStore.popupStates = Object.values(value);
      },
    };

    const { workflowStates } = await browser.storage.local.get(
      'workflowStates'
    );
    workflowStore.states = Object.values(workflowStates || {});

    const tabs = await browser.tabs.query({
      url: browser.runtime.getURL('/newtab.html'),
    });

    const currentWindow = await browser.windows.getCurrent();
    if (currentWindow.type !== 'popup') {
      await browser.tabs.remove([tabs[0].id]);
      return;
    }

    if (tabs.length > 1) {
      const firstTab = tabs.shift();
      await browser.windows.update(firstTab.windowId, { focused: true });
      await browser.tabs.update(firstTab.id, { active: true });

      await browser.tabs.remove(tabs.map((tab) => tab.id));
      return;
    }

    const { isFirstTime } = await browser.storage.local.get('isFirstTime');
    isUpdated.value = !isFirstTime && compare(currentVersion, prevVersion, '>');

    await Promise.allSettled([
      folderStore.load(),
      store.loadSettings(),
      workflowStore.loadData(),
      teamWorkflowStore.loadData(),
      hostedWorkflowStore.loadData(),
      packageStore.loadData(),
    ]);

    await loadLocaleMessages(store.settings.locale, 'newtab');
    await setI18nLanguage(store.settings.locale);

    await dataMigration();
    await userStore.loadUser({ useCache: false, ttl: 2 });

    await automa('app');

    retrieved.value = true;

    await Promise.allSettled([
      sharedWorkflowStore.fetchWorkflows(),
      fetchUserData(),
      syncHostedWorkflows(),
    ]);

    const { isRecording } = await browser.storage.local.get('isRecording');
    if (isRecording) {
      router.push('/recording');

      await (browser.action || browser.browserAction).setBadgeBackgroundColor({
        color: '#ef4444',
      });
      await (browser.action || browser.browserAction).setBadgeText({
        text: 'rec',
      });
    }

    autoDeleteLogs();
  } catch (error) {
    retrieved.value = true;
    console.error(error);
  }

  localStorage.setItem('ext-version', currentVersion);
})();
</script>
<style>
html,
body {
  @apply bg-gray-50 dark:bg-gray-900 text-black dark:text-gray-100;
}

body {
  min-height: 100vh;
}

#app {
  height: 100%;
}

h1,
h2,
h3 {
  @apply dark:text-white;
}
</style>
