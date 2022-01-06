<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full mb-2"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      v-if="false"
      :model-value="data.type"
      class="w-full mb-2"
      @change="updateData({ type: $event })"
    >
      <option value="get">
        {{ t('workflow.blocks.google-sheets.select.get') }}
      </option>
      <option value="write">
        {{ t('workflow.blocks.google-sheets.select.write') }}
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
          href="https://github.com/Kholid060/automa/wiki/Blocks#spreadsheet-id"
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
          href="https://github.com/Kholid060/automa/wiki/Blocks#range"
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
        v-if="previewDataState.data"
        :model-value="previewDataState.data"
        readonly
        class="mt-4 max-h-96"
      />
    </template>
    <template v-else-if="data.type === 'write'">
      <pre>
        halo
      </pre>
    </template>
  </div>
</template>
<script setup>
import { shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { getGoogleSheetsValue } from '@/utils/api';
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

const previewDataState = shallowReactive({
  status: 'idle',
  errorMessage: '',
  data: '',
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
async function previewData() {
  try {
    previewDataState.status = 'loading';
    const response = await getGoogleSheetsValue(
      props.data.spreadsheetId,
      props.data.range
    );

    if (response.status !== 200) {
      throw new Error(response.statusText);
    }

    const { values } = await response.json();
    const sheetsData = props.data.firstRowAsKey
      ? convert2DArrayToArrayObj(values)
      : values;

    previewDataState.data = JSON.stringify(sheetsData, null, 2);

    previewDataState.status = 'idle';
  } catch (error) {
    console.error(error);
    previewDataState.status = 'error';
    previewDataState.errorMessage = error.message;
  }
}
</script>
