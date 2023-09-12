<template>
  <div class="max-w-xl">
    <ui-card class="mb-12">
      <h2 class="mb-2 font-semibold">
        {{ t('settings.backupWorkflows.cloud.title') }}
      </h2>
      <template v-if="userStore.user">
        <div
          class="flex items-center rounded-lg border p-4 dark:border-gray-700"
        >
          <span class="bg-box-transparent inline-block rounded-full p-2">
            <v-remixicon name="riUploadLine" />
          </span>
          <div class="ml-4 flex-1 leading-tight">
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
          class="mt-2 flex items-center rounded-lg border p-4 dark:border-gray-700"
        >
          <span class="bg-box-transparent inline-block rounded-full p-2">
            <v-remixicon name="riDownloadLine" />
          </span>
          <p class="ml-4 flex-1">
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
      <div v-else class="py-4 text-center">
        <p>
          {{ t('settings.backupWorkflows.needSignin') }}
        </p>
        <ui-button
          tag="a"
          href="https://automa.site/auth"
          target="_blank"
          class="mt-4 inline-block w-44"
        >
          {{ t('auth.signIn') }}
        </ui-button>
      </div>
      <p v-if="false">
        Upgrade to the
        <a
          href="https://automa.site/pricing"
          target="_blank"
          class="text-yellow-500 underline dark:text-yellow-300"
        >
          pro plan
        </a>
        to start back up your workflows to the cloud
      </p>
    </ui-card>
    <h2 class="mb-2 font-semibold">
      {{ t('settings.backupWorkflows.title') }}
    </h2>
    <div class="flex space-x-4">
      <div class="w-6/12 rounded-lg border p-4 dark:border-gray-700">
        <div class="text-center">
          <span class="bg-box-transparent inline-block rounded-full p-4">
            <v-remixicon name="riDownloadLine" size="36" />
          </span>
        </div>
        <ui-checkbox v-model="state.encrypt" class="mt-12 mb-4">
          {{ t('settings.backupWorkflows.backup.encrypt') }}
        </ui-checkbox>
        <div class="flex items-center gap-2">
          <ui-popover @close="registerScheduleBackup">
            <template #trigger>
              <ui-button
                v-tooltip="t('settings.backupWorkflows.backup.settings')"
                icon
                :class="{ 'text-primary': localBackupSchedule.schedule }"
              >
                <v-remixicon name="riSettings3Line" />
              </ui-button>
            </template>
            <div class="w-64">
              <p class="mb-2 font-semibold">
                {{ t('settings.backupWorkflows.backup.settings') }}
              </p>
              <p>Also backup</p>
              <div class="flex mt-1 flex-col gap-2">
                <ui-checkbox
                  v-for="item in BACKUP_ITEMS_INCLUDES"
                  :key="item.id"
                  :model-value="
                    localBackupSchedule.includedItems.includes(item.id)
                  "
                  @change="
                    $event
                      ? localBackupSchedule.includedItems.push(item.id)
                      : localBackupSchedule.includedItems.splice(
                          localBackupSchedule.includedItems.indexOf(item.id),
                          1
                        )
                  "
                >
                  {{ item.name }}
                </ui-checkbox>
              </div>
              <p class="mt-4">
                {{ t('settings.backupWorkflows.backup.schedule') }}
              </p>
              <template v-if="!downloadPermission.has.downloads">
                <p class="text-gray-600 dark:text-gray-300 mt-1">
                  Automa requires the "Downloads" permission for the schedule
                  backup to work
                </p>
                <ui-button
                  class="mt-2 w-full"
                  @click="downloadPermission.request()"
                >
                  Allow "Downloads" permission
                </ui-button>
              </template>
              <template v-else>
                <ui-select
                  v-model="localBackupSchedule.schedule"
                  class="w-full mt-2"
                >
                  <option value="">Never</option>
                  <option
                    v-for="(value, key) in BACKUP_SCHEDULES"
                    :key="key"
                    :value="key"
                  >
                    {{ value }}
                  </option>
                  <option value="custom">Custom</option>
                </ui-select>
                <template v-if="localBackupSchedule.schedule === 'custom'">
                  <ui-input
                    v-model="localBackupSchedule.customSchedule"
                    label="Cron Expression"
                    class="w-full mt-2"
                    placeholder="0 8 * * *"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {{ getBackupScheduleCron() }}
                  </p>
                </template>
                <ui-input
                  v-if="localBackupSchedule.schedule !== ''"
                  v-model="localBackupSchedule.folderName"
                  label="Folder name"
                  class="w-full mt-2"
                  placeholder="backup-folder"
                />
                <p
                  v-if="localBackupSchedule.lastBackup"
                  class="text-gray-600 dark:text-gray-300 text-sm mt-4"
                >
                  Last backup:
                  {{ dayjs(localBackupSchedule.lastBackup).fromNow() }}
                </p>
              </template>
            </div>
          </ui-popover>
          <ui-button class="flex-1" @click="backupWorkflows">
            {{ t('settings.backupWorkflows.backup.button') }}
          </ui-button>
        </div>
      </div>
      <div class="w-6/12 rounded-lg border p-4 dark:border-gray-700">
        <div class="text-center">
          <span class="bg-box-transparent inline-block rounded-full p-4">
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
    :title="t('settings.backupWorkflows.cloud.title')"
    content-class="max-w-5xl"
  >
    <settings-cloud-backup
      v-model:ids="backupState.ids"
      @close="backupState.modal = false"
    />
  </ui-modal>
</template>
<script setup>
import { reactive, toRaw, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import dayjs from 'dayjs';
import AES from 'crypto-js/aes';
import cronParser from 'cron-parser';
import dbStorage from '@/db/storage';
import encUtf8 from 'crypto-js/enc-utf8';
import browser from 'webextension-polyfill';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import { useDialog } from '@/composable/dialog';
import { readableCron } from '@/lib/cronstrue';
import { useUserStore } from '@/stores/user';
import { getUserWorkflows } from '@/utils/api';
import { useWorkflowStore } from '@/stores/workflow';
import { useHasPermissions } from '@/composable/hasPermissions';
import { fileSaver, openFilePicker, parseJSON } from '@/utils/helper';
import SettingsCloudBackup from '@/components/newtab/settings/SettingsCloudBackup.vue';

const BACKUP_SCHEDULES = {
  '0 8 * * *': 'Every day',
  '0 8 * * 0': 'Every week',
};
const BACKUP_ITEMS_INCLUDES = [
  { id: 'storage:table', name: 'Storage tables' },
  { id: 'storage:variables', name: 'Storage variables' },
];

const { t } = useI18n();
const toast = useToast();
const dialog = useDialog();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const downloadPermission = useHasPermissions(['downloads']);

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
const localBackupSchedule = reactive({
  schedule: '',
  lastBackup: null,
  includedItems: [],
  customSchedule: '',
  folderName: 'automa-backup',
});

async function registerScheduleBackup() {
  try {
    if (!localBackupSchedule.schedule.trim()) {
      await browser.alarms.clear('schedule-local-backup');
    } else {
      const expression =
        localBackupSchedule.schedule === 'custom'
          ? localBackupSchedule.customSchedule
          : localBackupSchedule.schedule;
      const parsedExpression = cronParser.parseExpression(expression).next();
      if (!parsedExpression) return;

      await browser.alarms.create('schedule-local-backup', {
        when: parsedExpression.getTime(),
      });
    }

    browser.storage.local.set({
      localBackupSettings: toRaw(localBackupSchedule),
    });
  } catch (error) {
    console.error(error);
  }
}
function getBackupScheduleCron() {
  try {
    const expression = localBackupSchedule.customSchedule;

    return `${readableCron(expression)}`;
  } catch (error) {
    return error.message;
  }
}
function formatDate(date) {
  if (!date) return 'null';

  return dayjs(date).format('DD MMMM YYYY, hh:mm A');
}
async function syncBackupWorkflows() {
  try {
    state.loadingSync = true;
    const { backup, hosted } = await getUserWorkflows(false);
    const backupIds = backup.map(({ id }) => id);

    userStore.backupIds = backupIds;
    userStore.hostedWorkflows = hosted;

    await browser.storage.local.set({
      backupIds,
      lastBackup: new Date().toISOString(),
    });

    await workflowStore.insertOrUpdate(backup, { checkUpdateDate: true });

    state.loadingSync = false;
  } catch (error) {
    console.error(error);
    toast.error(t('message.somethingWrong'));
    state.loadingSync = false;
  }
}
async function backupWorkflows() {
  try {
    const workflows = workflowStore.getWorkflows.reduce((acc, workflow) => {
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

    if (localBackupSchedule.includedItems.includes('storage:table')) {
      const tables = await dbStorage.tablesItems.toArray();
      payload.storageTables = JSON.stringify(tables);
    }
    if (localBackupSchedule.includedItems.includes('storage:variables')) {
      const variables = await dbStorage.variables.toArray();
      payload.storageVariables = JSON.stringify(variables);
    }

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
  } catch (error) {
    console.error(error);
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
            count: Object.values(event).length,
          })
        );
      };

      if (state.updateIfExists) {
        return workflowStore.insertOrUpdate(newWorkflows).then(showMessage);
      }

      return workflowStore.insert(newWorkflows).then(showMessage);
    };

    reader.onload = ({ target }) => {
      const payload = parseJSON(target.result, null);
      if (!payload) return;

      const storageTables = parseJSON(payload.storageTables, null);
      if (Array.isArray(storageTables)) {
        dbStorage.tablesItems.bulkPut(storageTables);
      }

      const storageVariables = parseJSON(payload.storageVariables, null);
      if (Array.isArray(storageVariables)) {
        dbStorage.variables.bulkPut(storageVariables);
      }

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

onMounted(async () => {
  const { lastBackup, lastSync, localBackupSettings } =
    await browser.storage.local.get([
      'lastSync',
      'lastBackup',
      'localBackupSettings',
    ]);

  Object.assign(localBackupSchedule, localBackupSettings || {});

  state.lastSync = lastSync;
  state.lastBackup = lastBackup;
});
</script>
