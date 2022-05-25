<template>
  <template v-if="retrieved">
    <app-sidebar />
    <main class="pl-16">
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
        :href="`https://github.com/Kholid060/automa/releases/tag/v${currentVersion}`"
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
  </template>
  <div v-else class="py-8 text-center">
    <ui-spinner color="text-accent" size="28" />
  </div>
  <ui-card
    v-if="modalState.show"
    class="fixed bottom-8 right-8 shadow-2xl border-2 w-72 group"
  >
    <button
      class="absolute bg-white shadow-md rounded-full -right-2 -top-2 transition scale-0 group-hover:scale-100"
      @click="closeModal"
    >
      <v-remixicon
        class="text-gray-600 dark:text-gray-200"
        name="riCloseLine"
      />
    </button>
    <h2 class="font-semibold text-lg">
      {{ activeModal.title }}
    </h2>
    <p class="mt-1 dark:text-gray-100 text-gray-700">
      {{ activeModal.body }}
    </p>
    <div class="space-y-2 mt-4">
      <ui-button
        :href="activeModal.url"
        tag="a"
        target="_blank"
        rel="noopener"
        class="w-full block"
        variant="accent"
      >
        {{ activeModal.button }}
      </ui-button>
    </div>
  </ui-card>
</template>
<script setup>
import { ref, shallowReactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { compare } from 'compare-versions';
import browser from 'webextension-polyfill';
import { useTheme } from '@/composable/theme';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vueI18n';
import { fetchApi, getSharedWorkflows, getUserWorkflows } from '@/utils/api';
import dayjs from '@/lib/dayjs';
import Log from '@/models/log';
import Workflow from '@/models/workflow';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';

const { t } = useI18n();
const store = useStore();
const theme = useTheme();

theme.init();

const retrieved = ref(false);
const isUpdated = ref(false);
const modalState = shallowReactive({
  show: true,
  type: 'survey',
});

const modalTypes = {
  testimonial: {
    title: 'Hi There 👋',
    body: 'Thank you for using Automa, and if you have a great experience. Would you like to give us a testimonial?',
    button: 'Give Testimonial',
    url: 'https://testimonial.to/automa',
  },
  survey: {
    title: "How do you think we're doing?",
    body: 'To help us make Automa as best it can be, we need a few minutes of your time to get your feedback.',
    button: 'Take Survey',
    url: 'https://www.automa.site/survey',
  },
};
const currentVersion = browser.runtime.getManifest().version;
const prevVersion = localStorage.getItem('ext-version') || '0.0.0';

const activeModal = computed(() => modalTypes[modalState.type]);

async function syncHostWorkflow(hosts) {
  const hostIds = [];
  const workflowHosts = hosts || store.state.workflowHosts;
  const localWorkflowHost = Object.values(store.state.hostWorkflows);

  Object.keys(workflowHosts).forEach((hostId) => {
    const isItsOwn = localWorkflowHost.find((item) => item.hostId === hostId);

    if (isItsOwn) return;

    hostIds.push({ hostId, updatedAt: workflowHosts[hostId].updatedAt });
  });

  try {
    await store.dispatch('fetchWorkflowHosts', hostIds);
  } catch (error) {
    console.error(error);
  }
}
async function fetchUserData() {
  try {
    const response = await fetchApi('/me');
    const user = await response.json();

    if (response.status !== 200) {
      throw new Error(response.statusText);
    }

    const username = localStorage.getItem('username');

    if (!user || username !== user.username) {
      sessionStorage.removeItem('shared-workflows');
      sessionStorage.removeItem('user-workflows');
      sessionStorage.removeItem('backup-workflows');

      await browser.storage.local.remove([
        'backupIds',
        'lastBackup',
        'lastSync',
      ]);

      if (username !== user?.username) {
        await Workflow.update({
          where: ({ __id }) => __id !== null,
          data: { __id: null },
        });
      }

      if (!user) return;
    }

    store.commit('updateState', {
      key: 'user',
      value: user,
    });

    const [sharedWorkflows, userWorkflows] = await Promise.allSettled([
      getSharedWorkflows(),
      getUserWorkflows(),
    ]);

    localStorage.setItem('username', user.username);

    if (sharedWorkflows.status === 'fulfilled') {
      store.commit('updateState', {
        key: 'sharedWorkflows',
        value: sharedWorkflows.value,
      });
    }

    if (userWorkflows.status === 'fulfilled') {
      const { backup, hosted } = userWorkflows.value;

      store.commit('updateState', {
        key: 'hostWorkflows',
        value: hosted || {},
      });

      if (backup?.length > 0) {
        const { lastBackup } = browser.storage.local.get('lastBackup');
        if (!lastBackup) {
          const backupIds = backup.map(({ id }) => id);

          store.commit('updateState', {
            key: 'backupIds',
            value: backupIds,
          });
          await browser.storage.local.set({
            backupIds,
            lastBackup: new Date().toISOString(),
          });
        }

        await Workflow.insertOrUpdate({
          data: backup,
        });
      }
    }

    store.commit('updateState', {
      key: 'userDataRetrieved',
      value: true,
    });
  } catch (error) {
    console.error(error);
  }
}
/* eslint-disable-next-line */
function autoDeleteLogs() {
  const deleteAfter = store.state.settings.deleteLogAfter;

  if (deleteAfter === 'never') return;

  Log.delete(({ endedAt }) => {
    const diff = dayjs().diff(dayjs(endedAt), 'day');

    return diff >= deleteAfter;
  });
}
function handleStorageChanged(change) {
  if (change.logs) {
    store.dispatch('entities/create', {
      entity: 'logs',
      data: change.logs.newValue,
    });
  }

  if (change.workflowState) {
    store.commit('updateState', {
      key: 'workflowState',
      value: Object.values(change.workflowState.newValue || {}).filter(
        ({ isDestroyed, parentState }) =>
          !isDestroyed && !parentState?.isCollection
      ),
    });
  }
}
function closeModal() {
  let value = true;

  if (modalState.type === 'survey') {
    value = new Date().toString();
  }

  modalState.show = false;
  localStorage.setItem(`has-${modalState.type}`, value);
}
function checkModal() {
  const survey = localStorage.getItem('has-survey');

  if (!survey) return;

  const daysDiff = dayjs().diff(survey, 'day');
  const showTestimonial =
    daysDiff >= 2 && !localStorage.getItem('has-testimonial');

  if (showTestimonial) {
    modalState.show = true;
    modalState.type = 'testimonial';
  } else {
    modalState.show = false;
  }
}

browser.storage.onChanged.addListener(handleStorageChanged);

window.addEventListener('beforeunload', () => {
  browser.storage.onChanged.removeListener(handleStorageChanged);
});

(async () => {
  try {
    checkModal();

    const { isFirstTime } = await browser.storage.local.get('isFirstTime');
    isUpdated.value = !isFirstTime && compare(currentVersion, prevVersion, '>');

    await Promise.allSettled([
      store.dispatch('retrieve', ['workflows', 'logs', 'collections']),
      store.dispatch('retrieveWorkflowState'),
    ]);

    await loadLocaleMessages(store.state.settings.locale, 'newtab');
    await setI18nLanguage(store.state.settings.locale);

    retrieved.value = true;

    await fetchUserData();
    await syncHostWorkflow();

    // autoDeleteLogs();
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
