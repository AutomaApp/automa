<template>
  <div class="max-w-xl">
    <ui-card v-if="$store.state.user" class="mb-12">
      <h2 class="font-semibold mb-2">
        {{ t('settings.backupWorkflows.cloud.title') }}
      </h2>
      <template v-if="$store.state.user.subscription !== 'free'">
        <div
          class="border dark:border-gray-700 p-4 rounded-lg flex items-center"
        >
          <span class="inline-block p-2 rounded-full bg-box-transparent">
            <v-remixicon name="riUploadLine" />
          </span>
          <div class="flex-1 ml-4 leading-tight">
            <p class="text-sm text-gray-600 dark:text-gray-200">
              {{ t('settings.backupWorkflows.cloud.lastBackup') }}
            </p>
            <p>{{ formatDate(state.lastBackup) }}</p>
          </div>
          <ui-button
            :loading="backupState.loading"
            @click="backupState.modal = true"
          >
            {{ t('settings.backupWorkflows.backup.button') }}
          </ui-button>
        </div>
        <div
          class="border dark:border-gray-700 p-4 rounded-lg flex items-center mt-2"
        >
          <span class="inline-block p-2 rounded-full bg-box-transparent">
            <v-remixicon name="riDownloadLine" />
          </span>
          <p class="flex-1 ml-4">
            {{ t('settings.backupWorkflows.cloud.sync') }}
          </p>
          <ui-button
            :loading="state.loadingSync"
            class="ml-2"
            @click="syncBackupWorkflows"
          >
            {{ t('settings.backupWorkflows.cloud.sync') }}
          </ui-button>
        </div>
      </template>
      <p v-else>
        Upgrade to the
        <a
          href="https://automa.site/pricing"
          target="_blank"
          class="dark:text-yellow-300 text-yellow-500 underline"
        >
          pro plan
        </a>
        to start back up your workflows to the cloud
      </p>
    </ui-card>
    <h2 class="font-semibold mb-2">
      {{ t('settings.backupWorkflows.title') }}
    </h2>
    <div class="flex space-x-4">
      <div class="border dark:border-gray-700 p-4 rounded-lg w-6/12">
        <div class="text-center">
          <span class="inline-block p-4 rounded-full bg-box-transparent">
            <v-remixicon name="riDownloadLine" size="36" />
          </span>
        </div>
        <ui-checkbox v-model="state.encrypt" class="mt-12 mb-4">
          {{ t('settings.backupWorkflows.backup.encrypt') }}
        </ui-checkbox>
        <ui-button class="w-full" @click="backupWorkflows">
          {{ t('settings.backupWorkflows.backup.button') }}
        </ui-button>
      </div>
      <div class="border dark:border-gray-700 p-4 rounded-lg w-6/12">
        <div class="text-center">
          <span class="inline-block p-4 rounded-full bg-box-transparent">
            <v-remixicon name="riUploadLine" size="36" />
          </span>
        </div>
        <ui-checkbox v-model="state.updateIfExists" class="mt-6 mb-4">
          {{ t('settings.backupWorkflows.restore.update') }}
        </ui-checkbox>
        <ui-button class="w-full" @click="restoreWorkflows">
          {{ t('settings.backupWorkflows.restore.button') }}
        </ui-button>
      </div>
    </div>
  </div>
  <ui-modal
    v-model="backupState.modal"
    content-class="max-w-4xl"
    persist
    blur
    custom-content
  >
    <settings-cloud-backup
      v-model:ids="backupState.ids"
      @close="backupState.modal = false"
    />
  </ui-modal>
</template>
<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import dayjs from 'dayjs';
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';
import browser from 'webextension-polyfill';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import { useDialog } from '@/composable/dialog';
import { getUserWorkflows } from '@/utils/api';
import { fileSaver, openFilePicker, parseJSON } from '@/utils/helper';
import Workflow from '@/models/workflow';
import SettingsCloudBackup from '@/components/newtab/settings/SettingsCloudBackup.vue';

const { t } = useI18n();
const store = useStore();
const toast = useToast();
const dialog = useDialog();

const state = reactive({
  lastSync: null,
  encrypt: false,
  lastBackup: null,
  loadingSync: false,
  updateIfExists: false,
});
const backupState = reactive({
  ids: [],
  modal: false,
  loading: false,
});

function formatDate(date) {
  if (!date) return 'null';

  return dayjs(date).format('DD MMMM YYYY, hh:mm A');
}
async function syncBackupWorkflows() {
  try {
    state.loadingSync = true;
    const { backup, hosted } = await getUserWorkflows(false);

    store.commit('updateState', {
      key: 'hostWorkflows',
      value: hosted,
    });
    await browser.storage.local.set({
      lastBackup: new Date().toISOString(),
    });
    await Workflow.insertOrUpdate({
      data: backup,
    });

    state.loadingSync = false;
  } catch (error) {
    console.error(error);
    toast.error(t('message.somethingWrong'));
    state.loadingSync = false;
  }
}
function backupWorkflows() {
  const workflows = Workflow.all().reduce((acc, workflow) => {
    if (workflow.isProtected) return acc;

    delete workflow.$id;
    delete workflow.createdAt;
    delete workflow.data;
    delete workflow.isDisabled;
    delete workflow.isProtected;

    acc.push(workflow);

    return acc;
  }, []);
  const payload = {
    isProtected: state.encrypt,
    workflows: JSON.stringify(workflows),
  };
  const downloadFile = (data) => {
    const fileName = `automa-${dayjs().format('DD-MM-YYYY')}.json`;
    const blob = new Blob([JSON.stringify(data)], {
      type: 'application/json',
    });
    const objectUrl = URL.createObjectURL(blob);

    fileSaver(fileName, objectUrl);

    URL.revokeObjectURL(objectUrl);
  };

  if (state.encrypt) {
    dialog.prompt({
      placeholder: t('common.password'),
      title: t('settings.backupWorkflows.title'),
      okText: t('settings.backupWorkflows.backup.button'),
      inputType: 'password',
      onConfirm: (password) => {
        const encryptedWorkflows = AES.encrypt(
          payload.workflows,
          password
        ).toString();
        const hmac = hmacSHA256(encryptedWorkflows, password).toString();

        payload.workflows = hmac + encryptedWorkflows;

        downloadFile(payload);
      },
    });
  } else {
    downloadFile(payload);
  }
}
async function restoreWorkflows() {
  try {
    const [file] = await openFilePicker('application/json');
    const reader = new FileReader();
    const insertWorkflows = (workflows) => {
      const newWorkflows = workflows.map((workflow) => {
        if (!state.updateIfExists) {
          workflow.createdAt = Date.now();
          delete workflow.id;
        }

        return workflow;
      });
      const showMessage = (event) => {
        toast(
          t('settings.backupWorkflows.workflowsAdded', {
            count: event.workflows.length,
          })
        );
      };

      if (state.updateIfExists) {
        return Workflow.insertOrUpdate({
          data: newWorkflows,
        }).then(showMessage);
      }

      return Workflow.insert({
        data: newWorkflows,
      }).then(showMessage);
    };

    reader.onload = ({ target }) => {
      const payload = parseJSON(target.result, null);

      if (!payload) return;

      if (payload.isProtected) {
        dialog.prompt({
          placeholder: t('common.password'),
          title: t('settings.backupWorkflows.restore.title'),
          okText: t('settings.backupWorkflows.restore.button'),
          inputType: 'password',
          onConfirm: (password) => {
            const hmac = payload.workflows.substring(0, 64);
            const encryptedWorkflows = payload.workflows.substring(64);
            const decryptedHmac = hmacSHA256(
              encryptedWorkflows,
              password
            ).toString();

            if (hmac !== decryptedHmac) {
              toast.error(t('settings.backupWorkflows.invalidPassword'));

              return;
            }

            const decryptedWorkflows = AES.decrypt(
              encryptedWorkflows,
              password
            ).toString(encUtf8);
            payload.workflows = parseJSON(decryptedWorkflows, []);

            insertWorkflows(payload.workflows);
          },
        });
      } else {
        payload.workflows = parseJSON(payload.workflows, []);
        insertWorkflows(payload.workflows);
      }
    };

    reader.readAsText(file);
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

watch(
  () => store.state.userDataRetrieved,
  async () => {
    const { lastBackup, lastSync } = await browser.storage.local.get([
      'backupIds',
      'lastBackup',
      'lastSync',
    ]);

    state.lastSync = lastSync;
    state.lastBackup = lastBackup;
  },
  { immediate: true }
);
</script>
