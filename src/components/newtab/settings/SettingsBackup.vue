<template>
  <div class="max-w-xl mt-10">
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
</template>
<script setup>
import { shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import dayjs from 'dayjs';
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import { useDialog } from '@/composable/dialog';
import { fileSaver, openFilePicker, parseJSON } from '@/utils/helper';
import Workflow from '@/models/workflow';

const { t } = useI18n();
const toast = useToast();
const dialog = useDialog();

const state = shallowReactive({
  encrypt: false,
  updateIfExists: false,
});

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
    const file = await openFilePicker('application/json');
    const reader = new FileReader();
    const insertWorkflows = (workflows) => {
      workflows.forEach((workflow) => {
        const isWorkflowExists = Workflow.query()
          .where('id', workflow.id)
          .exists();

        if (!state.updateIfExists || !isWorkflowExists) {
          workflow.createdAt = Date.now();
          delete workflow.id;

          Workflow.insert({
            data: workflow,
          });

          return;
        }

        Workflow.update({
          where: workflow.id,
          data: workflow,
        });
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
</script>
