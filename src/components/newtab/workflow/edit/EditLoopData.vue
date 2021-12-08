<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.loopId"
      class="w-full mb-3"
      :label="t('workflow.blocks.loop-data.loopId')"
      :placeholder="t('workflow.blocks.loop-data.loopId')"
      @change="updateLoopID"
    />
    <ui-select
      :model-value="data.loopThrough"
      :placeholder="t('workflow.blocks.loop-data.loopThrough.placeholder')"
      class="w-full mb-2"
      @change="
        updateData({
          loopThrough: $event,
          loopData: $event === 'custom-data' ? data.loopData : '[]',
        })
      "
    >
      <option v-for="type in loopTypes" :key="type" :value="type">
        {{ t(`workflow.blocks.loop-data.loopThrough.options.${type}`) }}
      </option>
    </ui-select>
    <ui-input
      v-if="data.loopThrough !== 'numbers'"
      :model-value="data.maxLoop"
      :label="t('workflow.blocks.loop-data.maxLoop.label')"
      :title="t('workflow.blocks.loop-data.maxLoop.title')"
      class="w-full mb-4"
      min="0"
      type="number"
      @change="updateData({ maxLoop: +$event || 0 })"
    />
    <ui-button
      v-if="data.loopThrough === 'custom-data'"
      class="w-full"
      variant="accent"
      @click="state.showDataModal = true"
    >
      {{ t('workflow.blocks.loop-data.buttons.insert') }}
    </ui-button>
    <div
      v-else-if="data.loopThrough === 'numbers'"
      class="flex items-center space-x-2"
    >
      <ui-input
        :model-value="data.fromNumber"
        :label="t('workflow.blocks.loop-data.loopThrough.fromNumber')"
        type="number"
        @change="
          updateData({
            fromNumber: +$event >= data.toNumber ? data.toNumber - 1 : +$event,
          })
        "
      />
      <ui-input
        :model-value="data.toNumber"
        :label="t('workflow.blocks.loop-data.loopThrough.toNumber')"
        type="number"
        @change="
          updateData({
            toNumber:
              +$event <= data.fromNumber ? data.fromNumber + 1 : +$event,
          })
        "
      />
    </div>
    <ui-modal
      v-model="state.showDataModal"
      title="Data"
      content-class="max-w-3xl"
    >
      <div class="flex mb-4 items-center">
        <ui-button variant="accent" @click="importFile">
          {{ t('workflow.blocks.loop-data.buttons.import') }}
        </ui-button>
        <ui-button
          v-tooltip="t('commons.options')"
          :class="{ 'text-primary': state.showOptions }"
          icon
          class="ml-2"
          @click="state.showOptions = !state.showOptions"
        >
          <v-remixicon name="riSettings3Line" />
        </ui-button>
        <p class="flex-1 text-overflow mx-4">{{ file.name }}</p>
        <template v-if="data.loopData.length > maxStrLength">
          <p class="mr-2">
            {{ t('workflow.blocks.loop-data.modal.fileTooLarge') }}
          </p>
          <ui-button @click="updateData({ loopData: '[]' })">
            {{ t('workflow.blocks.loop-data.buttons.clear') }}
          </ui-button>
        </template>
        <p v-else>{{ t('workflow.blocks.loop-data.modal.maxFile') }}</p>
      </div>
      <div style="height: calc(100vh - 11rem)">
        <prism-editor
          v-show="!state.showOptions"
          v-model="state.tempLoopData"
          :highlight="highlighter('json')"
          :readonly="data.loopData.length > maxStrLength"
          class="py-4"
          @input="updateData({ loopData: $event.target.value })"
        />
        <div v-show="state.showOptions">
          <p class="font-semibold mb-2">CSV</p>
          <ui-checkbox v-model="options.header">
            {{ t('workflow.blocks.loop-data.modal.options.firstRow') }}
          </ui-checkbox>
        </div>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
/* eslint-disable no-alert */
import { onMounted, shallowReactive } from 'vue';
import { nanoid } from 'nanoid';
import { PrismEditor } from 'vue-prism-editor';
import { useI18n } from 'vue-i18n';
import Papa from 'papaparse';
import { highlighter } from '@/lib/prism';
import { openFilePicker } from '@/utils/helper';

const props = defineProps({
  blockId: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const maxStrLength = 5e4;
const maxFileSize = 1024 * 1024;
const loopTypes = ['data-columns', 'numbers', 'custom-data'];
const tempLoopData =
  props.data.loopData.length > maxStrLength
    ? props.data.loopData.slice(0, maxStrLength)
    : props.data.loopData;

const state = shallowReactive({
  tempLoopData,
  showOptions: false,
  showDataModal: false,
  workflowLoopData: {},
});
const options = shallowReactive({
  header: true,
});
const file = shallowReactive({
  size: 0,
  name: '',
  type: '',
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateLoopID(id) {
  let loopId = id.replace(/\s/g, '');

  if (!loopId) {
    loopId = nanoid(6);
  }

  updateData({ loopId });
}
function importFile() {
  openFilePicker(['application/json', 'text/csv', 'application/vnd.ms-excel'])
    .then(async (fileObj) => {
      if (fileObj.size > maxFileSize) {
        alert(t('message.maxSizeExceeded'));
        return;
      }

      file.name = fileObj.name;
      file.type = fileObj.type;

      const csvTypes = ['text/csv', 'application/vnd.ms-excel'];

      const reader = new FileReader();

      reader.onload = ({ target }) => {
        let loopData;

        if (fileObj.type === 'application/json') {
          const result = JSON.parse(target.result);
          loopData = Array.isArray(result) ? result : [result];
        } else if (csvTypes.includes(fileObj.type)) {
          loopData = Papa.parse(target.result, options).data;
        }

        if (Array.isArray(loopData)) {
          const loopDataStr = JSON.stringify(loopData);

          state.tempLoopData =
            loopDataStr.length > maxStrLength
              ? loopDataStr.slice(0, maxStrLength)
              : loopDataStr;
          updateData({ loopData: loopDataStr });
        }
      };

      reader.readAsText(fileObj);
    })
    .catch((error) => {
      console.error(error);
      if (error.message.startsWith('invalid')) alert(error.message);
    });
}

onMounted(() => {
  if (!props.data.loopId) {
    updateData({ loopId: nanoid(6) });
  }
});
</script>
