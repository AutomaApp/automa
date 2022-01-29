<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full mb-2"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.type"
      class="w-full mb-2"
      @change="updateData({ type: $event })"
    >
      <option value="get">
        {{ t('workflow.blocks.google-sheets.select.get') }}
      </option>
      <option value="update">
        {{ t('workflow.blocks.google-sheets.select.update') }}
      </option>
    </ui-select>
    <ui-input
      :model-value="data.spreadsheetId"
      class="w-full"
      placeholder="abcd123"
      @change="updateData({ spreadsheetId: $event })"
    >
      <template #label>
        {{ t('workflow.blocks.google-sheets.spreadsheetId.label') }}
        <a
          href="https://docs.automa.site/blocks/google-sheets.html#spreadsheet-id"
          target="_blank"
          rel="noopener"
          :title="t('workflow.blocks.google-sheets.spreadsheetId.link')"
        >
          <v-remixicon name="riInformationLine" size="18" class="inline" />
        </a>
      </template>
    </ui-input>
    <ui-input
      :model-value="data.range"
      class="w-full mt-1"
      placeholder="Sheet1!A1:B2"
      @change="updateData({ range: $event })"
    >
      <template #label>
        {{ t('workflow.blocks.google-sheets.range.label') }}
        <a
          href="https://docs.automa.site/blocks/google-sheets.html#range"
          target="_blank"
          rel="noopener"
          :title="t('workflow.blocks.google-sheets.range.link')"
        >
          <v-remixicon name="riInformationLine" size="18" class="inline" />
        </a>
      </template>
    </ui-input>
    <template v-if="data.type === 'get'">
      <ui-input
        :model-value="data.refKey"
        :label="t('workflow.blocks.google-sheets.refKey.label')"
        :placeholder="t('workflow.blocks.google-sheets.refKey.placeholder')"
        class="mt-1 w-full"
        @change="updateData({ refKey: $event })"
      />
      <ui-checkbox
        :model-value="data.firstRowAsKey"
        class="mt-3"
        @change="updateData({ firstRowAsKey: $event })"
      >
        {{ t('workflow.blocks.google-sheets.firstRow') }}
      </ui-checkbox>
      <ui-button
        :loading="previewDataState.status === 'loading'"
        variant="accent"
        class="mt-3"
        @click="previewData"
      >
        {{ t('workflow.blocks.google-sheets.previewData') }}
      </ui-button>
      <p v-if="previewDataState.status === 'error'" class="text-red-500">
        {{ previewDataState.errorMessage }}
      </p>
      <shared-codemirror
        v-if="previewDataState.data && previewDataState.status !== 'error'"
        :model-value="previewDataState.data"
        readonly
        class="mt-4 max-h-96"
      />
    </template>
    <template v-else-if="data.type === 'update'">
      <ui-select
        :model-value="data.valueInputOption"
        class="w-full mt-2"
        @change="updateData({ valueInputOption: $event })"
      >
        <template #label>
          {{ t('workflow.blocks.google-sheets.valueInputOption') }}
          <a
            href="https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption"
            target="_blank"
            rel="noopener"
          >
            <v-remixicon name="riInformationLine" size="18" class="inline" />
          </a>
        </template>
        <option
          v-for="option in valueInputOptions"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </ui-select>
      <ui-select
        :model-value="data.dataFrom"
        :label="t('workflow.blocks.google-sheets.dataFrom.label')"
        class="w-full mt-2"
        @change="updateData({ dataFrom: $event })"
      >
        <option v-for="item in dataFrom" :key="item" :value="item">
          {{ t(`workflow.blocks.google-sheets.dataFrom.options.${item}`) }}
        </option>
      </ui-select>
      <ui-checkbox
        v-if="data.dataFrom === 'data-columns'"
        :model-value="data.keysAsFirstRow"
        class="mt-2"
        @change="updateData({ keysAsFirstRow: $event })"
      >
        {{ t('workflow.blocks.google-sheets.keysAsFirstRow') }}
      </ui-checkbox>
      <ui-button
        v-else
        class="w-full mt-2"
        variant="accent"
        @click="customDataState.showModal = true"
      >
        {{ t('workflow.blocks.google-sheets.insertData') }}
      </ui-button>
    </template>
    <ui-modal
      v-model="customDataState.showModal"
      title="Custom data"
      content-class="max-w-xl"
    >
      <shared-codemirror
        v-model="customDataState.data"
        style="height: calc(100vh - 10rem)"
        lang="json"
        @change="updateData({ customData: $event })"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { googleSheets } from '@/utils/api';
import { convert2DArrayToArrayObj } from '@/utils/helper';
import SharedCodemirror from '@/components/newtab/shared/SharedCodemirror.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const dataFrom = ['data-columns', 'custom'];
const valueInputOptions = ['RAW', 'USER_ENTERED'];

const previewDataState = shallowReactive({
  data: '',
  status: 'idle',
  errorMessage: '',
});
const customDataState = shallowReactive({
  showModal: false,
  data: props.data.customData,
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
async function previewData() {
  try {
    previewDataState.status = 'loading';
    const response = await googleSheets.getValues({
      spreadsheetId: props.data.spreadsheetId,
      range: props.data.range,
    });

    if (response.status !== 200) {
      const error = await response.json();

      throw new Error(response.statusText || error.statusMessage);
    }

    const { values } = await response.json();
    const sheetsData = props.data.firstRowAsKey
      ? convert2DArrayToArrayObj(values)
      : values;

    previewDataState.data = JSON.stringify(sheetsData, null, 2);

    previewDataState.status = 'idle';
  } catch (error) {
    console.dir(error);
    previewDataState.data = '';
    previewDataState.status = 'error';
    previewDataState.errorMessage = error.message;
  }
}
</script>
