<template>
  <div v-if="!store.integrations.googleDrive">
    <p>
      You haven't
      <a
        href="https://docs.automa.site/integrations/google-drive.html"
        target="_blank"
        class="underline"
        >connected Automa to Google Drive</a
      >.
    </p>
  </div>
  <edit-google-sheets
    v-else
    google-drive
    :data="data"
    :additional-actions="['create', 'add-sheet']"
    @update:data="updateData"
  >
    <ui-tabs
      v-if="data.type !== 'create'"
      small
      :model-value="data.inputSpreadsheetId"
      fill
      class="w-full my-2"
      type="fill"
      @change="updateData({ inputSpreadsheetId: $event })"
    >
      <ui-tab value="connected"> Connected </ui-tab>
      <ui-tab value="manually"> Manually </ui-tab>
    </ui-tabs>
    <div
      v-if="data.type !== 'create' && data.inputSpreadsheetId === 'connected'"
      class="flex items-end"
    >
      <ui-select
        :model-value="data.spreadsheetId"
        :label="t('workflow.blocks.google-sheets-drive.connected')"
        :placeholder="t('workflow.blocks.google-sheets-drive.select')"
        class="w-full"
        @change="updateData({ spreadsheetId: $event })"
      >
        <option
          v-for="sheet in store.connectedSheets"
          :key="sheet.id"
          :value="sheet.id"
        >
          {{ sheet.name }}
        </option>
      </ui-select>
      <ui-button
        v-tooltip="t('workflow.blocks.google-sheets-drive.connect')"
        icon
        class="ml-2"
        @click="connectSheet"
      >
        <v-remixicon name="riLink" />
      </ui-button>
    </div>
    <ui-input
      v-if="['create', 'add-sheet'].includes(data.type)"
      :model-value="data.sheetName"
      label="Sheet name"
      placeholder="A Spreadsheet"
      class="w-full"
      @change="updateData({ sheetName: $event })"
    />
  </edit-google-sheets>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useStore } from '@/stores/main';
import openGDriveFilePicker from '@/utils/openGDriveFilePicker';
import EditGoogleSheets from './EditGoogleSheets.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const toast = useToast();
const store = useStore();
store.getConnectedSheets();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function connectSheet() {
  openGDriveFilePicker().then((result) => {
    if (!result) return;

    const { name, id, mimeType } = result;

    if (mimeType !== 'application/vnd.google-apps.spreadsheet') {
      toast.error('File is not a google spreadsheet');
      return;
    }

    const sheetExists = store.connectedSheets.some((sheet) => sheet.id === id);
    if (sheetExists) return;

    store.connectedSheets.push({ name, id });
  });
}
</script>
