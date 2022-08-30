<template>
  <div class="mb-10">
    <ui-textarea
      :model-value="data.description"
      class="w-full mb-2"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.type"
      class="w-full mb-2"
      @change="onActionChange"
    >
      <option v-for="action in actions" :key="action" :value="action">
        {{ t(`workflow.blocks.google-sheets.select.${action}`) }}
      </option>
    </ui-select>
    <edit-autocomplete>
      <ui-input
        :model-value="data.spreadsheetId"
        class="w-full"
        placeholder="abcd123"
        @change="updateData({ spreadsheetId: $event }), checkPermission($event)"
      >
        <template #label>
          {{ t('workflow.blocks.google-sheets.spreadsheetId.label') }}*
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
    </edit-autocomplete>
    <a
      v-if="!state.havePermission"
      href="https://docs.automa.site/blocks/google-sheets.html#access-to-spreadsheet"
      target="_blank"
      rel="noopener"
      class="text-sm leading-tight inline-block ml-1"
    >
      Automa doesn't have access to the spreadsheet
      <v-remixicon name="riInformationLine" size="18" class="inline" />
    </a>
    <edit-autocomplete>
      <ui-input
        :model-value="data.range"
        class="w-full mt-1"
        placeholder="Sheet1!A1:B2"
        @change="updateData({ range: $event })"
      >
        <template #label>
          {{ t('workflow.blocks.google-sheets.range.label') }}*
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
    </edit-autocomplete>
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
    </template>
    <template v-else-if="data.type === 'getRange'">
      <insert-workflow-data :data="data" variables @update="updateData" />
      <ui-button
        :loading="previewDataState.status === 'loading'"
        variant="accent"
        class="mt-4"
        @click="previewData"
      >
        {{ t('workflow.blocks.google-sheets.previewData') }}
      </ui-button>
    </template>
    <template v-else-if="['update', 'append'].includes(data.type)">
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
        :model-value="data.insertDataOption || 'INSERT_ROWS'"
        class="w-full mt-2"
        @change="updateData({ insertDataOption: $event })"
      >
        <template #label>
          {{ t('workflow.blocks.google-sheets.insertDataOption') }}
          <a
            href="https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append#InsertDataOption"
            target="_blank"
            rel="noopener"
          >
            <v-remixicon name="riInformationLine" size="18" class="inline" />
          </a>
        </template>
        <option
          v-for="option in insertDataOptions"
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
    <shared-codemirror
      v-if="
        previewDataState.data &&
        previewDataState.status !== 'error' &&
        data.type !== 'update'
      "
      :model-value="previewDataState.data"
      :line-numbers="false"
      readonly
      hide-lang
      class="mt-4 max-h-96 scroll"
    />
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
import { shallowReactive, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { googleSheets, fetchApi } from '@/utils/api';
import { convert2DArrayToArrayObj, debounce } from '@/utils/helper';
import EditAutocomplete from './EditAutocomplete.vue';
import InsertWorkflowData from './InsertWorkflowData.vue';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const actions = ['get', 'getRange', 'update', 'append'];
const dataFrom = ['data-columns', 'custom'];
const valueInputOptions = ['RAW', 'USER_ENTERED'];
const insertDataOptions = ['OVERWRITE', 'INSERT_ROWS'];

const previewDataState = shallowReactive({
  data: '',
  status: 'idle',
  errorMessage: '',
});
const customDataState = shallowReactive({
  showModal: false,
  data: props.data.customData,
});
const state = shallowReactive({
  lastSheetId: null,
  havePermission: true,
});

const checkPermission = debounce(async (value) => {
  try {
    if (state.lastSheetId === value) return;

    const response = await fetchApi(
      `/services/google-sheets/meta?spreadsheetId=${value}`
    );

    state.havePermission = response.status !== 403;
    state.lastSheetId = value;
  } catch (error) {
    console.error(error);
  }
}, 1000);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
async function previewData() {
  try {
    previewDataState.status = 'loading';

    const isGetValues = props.data.type === 'get';
    const params = {
      range: props.data.range,
      spreadsheetId: props.data.spreadsheetId,
    };
    const response = await (isGetValues
      ? googleSheets.getValues(params)
      : googleSheets.getRange(params));

    if (!response.ok) {
      const error = await response.json();

      throw new Error(error.message || response.statusText);
    }

    let result = await response.json();

    if (isGetValues) {
      result = props.data.firstRowAsKey
        ? convert2DArrayToArrayObj(result.values)
        : result.values;
    } else {
      result = {
        tableRange: result.tableRange || null,
        lastRange: result.updates.updatedRange,
      };
    }

    previewDataState.data = JSON.stringify(result, null, 2);
    previewDataState.status = 'idle';
  } catch (error) {
    console.error(error);
    previewDataState.data = '';
    previewDataState.status = 'error';
    previewDataState.errorMessage = error.message;
  }
}
function onActionChange(value) {
  updateData({ type: value });

  previewDataState.data = '';
  previewDataState.status = '';
  previewDataState.errorMessage = '';
}
</script>
