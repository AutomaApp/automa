<template>
  <template v-if="retrieved">
    <app-sidebar v-if="$route.name !== 'recording'" />
    <main :class="{ 'pl-16': $route.name !== 'recording' }">
      <router-view />
    </main>
    <ui-dialog>
      <template #auth>
        <div class="text-center">
          <p class="font-semibold text-xl">Oops!! 😬</p>
          <p class="mt-2 text-gray-600 dark:text-gray-200">
            {{ t('auth.text') }}
          </p>
          <ui-button
            tag="a"
            href="https://www.automa.site/auth"
            class="mt-6 w-full block"
            variant="accent"
          >
            {{ t('auth.signIn') }}
          </ui-button>
        </div>
      </template>
    </ui-dialog>
    <div
      v-if="isUpdated"
      class="p-4 shadow-2xl z-50 fixed bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-accent text-white dark:text-gray-900 flex items-center"
    >
      <v-remixicon name="riInformationLine" class="mr-3" />
      <p>
        {{ t('updateMessage.text1', { version: currentVersion }) }}
      </p>
      <a
        :href="`https://github.com/AutomaApp/automa/releases/latest`"
        target="_blank"
        rel="noopener"
        class="underline ml-1"
      >
        {{ t('updateMessage.text2') }}
      </a>
      <button
        class="ml-6 text-gray-200 dark:text-gray-600"
        @click="isUpdated = false"
      >
        <v-remixicon size="20" name="riCloseLine" />
      </button>
    </div>
    <shared-permissions-modal
      v-model="permissionState.showModal"
      :permissions="permissionState.items"
    />
  </template>
  <div v-else class="py-8 text-center">
    <ui-spinner color="text-accent" size="28" />
  </div>
  <app-survey />
</template>
<script setup>
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
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
import automa from '@business';
import dbLogs from '@/db/logs';
import dayjs from '@/lib/dayjs';
import AppSurvey from '@/components/newtab/app/AppSurvey.vue';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';
import dataMigration from '@/utils/dataMigration';
import iconFirefox from '@/assets/svg/logoFirefox.svg';
import iconChrome from '@/assets/svg/logo.svg';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal.vue';
import { startWorkflowExec } from '@/workflowEngine';

let icon;
if (window.location.protocol === 'moz-extension:') {
  icon = iconFirefox;
} else {
  icon = iconChrome;
}

const iconElement = document.createElement('link');
iconElement.rel = 'icon';
iconElement.href = icon;
document.head.appendChild(iconElement);

const { t } = useI18n();
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
  'workflow:execute': function ({ data, options = {} }) {
    startWorkflowExec(data, options);
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

  workflowStore.states = Object.values(workflowStates.newValue);
});

useHead(() => {
  const runningWorkflows = workflowStore.states.length;

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
  const runningWorkflows = workflowStore.states.length;
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

(async () => {
  try {
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

      await browser.action.setBadgeBackgroundColor({ color: '#ef4444' });
      await browser.action.setBadgeText({ text: 'rec' });
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
