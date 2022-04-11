<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full mb-1"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.loopId"
      class="w-full mb-2"
      :label="t('workflow.blocks.loop-data.loopId')"
      :placeholder="t('workflow.blocks.loop-data.loopId')"
      @change="updateLoopID"
    />
    <ui-select
      :model-value="data.loopThrough"
      :label="t('workflow.blocks.loop-data.loopThrough.placeholder')"
      class="w-full"
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
      v-if="data.loopThrough === 'google-sheets'"
      :model-value="data.referenceKey"
      :label="t('workflow.blocks.loop-data.refKey')"
      placeholder="abc123"
      class="w-full mt-2"
      @change="updateData({ referenceKey: $event })"
    />
    <ui-input
      v-else-if="data.loopThrough === 'variable'"
      :model-value="data.variableName"
      :label="t('workflow.variables.name')"
      placeholder="abc123"
      class="w-full mt-2"
      @change="updateData({ variableName: $event })"
    />
    <ui-autocomplete
      v-else-if="data.loopThrough === 'elements'"
      :items="autocomplete"
      :trigger-char="['{{', '}}']"
      block
      hide-empty
      class="mt-2"
    >
      <ui-input
        :model-value="data.elementSelector"
        :label="t('workflow.blocks.base.selector')"
        autocomplete="off"
        placeholder=".selector"
        class="w-full"
        @change="updateData({ elementSelector: $event })"
      />
    </ui-autocomplete>
    <ui-button
      v-else-if="data.loopThrough === 'custom-data'"
      class="w-full mt-4"
      variant="accent"
      @click="state.showDataModal = true"
    >
      {{ t('workflow.blocks.loop-data.buttons.insert') }}
    </ui-button>
    <div
      v-else-if="data.loopThrough === 'numbers'"
      class="flex items-center space-x-2 mt-2"
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
    <template v-if="data.loopThrough !== 'numbers'">
      <ui-input
        :model-value="data.maxLoop"
        :label="t('workflow.blocks.loop-data.maxLoop.label')"
        :title="t('workflow.blocks.loop-data.maxLoop.title')"
        class="w-full mt-2"
        min="0"
        type="number"
        @change="updateData({ maxLoop: +$event || 0 })"
      />
      <ui-input
        v-if="!data.resumeLastWorkflow"
        :model-value="data.startIndex"
        :label="t('workflow.blocks.loop-data.startIndex')"
        placeholder="0"
        class="w-full mt-2"
        min="0"
        type="number"
        @change="updateData({ startIndex: +$event || 0 })"
      />
      <ui-checkbox
        :model-value="data.resumeLastWorkflow"
        class="mt-1"
        @change="updateData({ resumeLastWorkflow: $event })"
      >
        {{ t('workflow.blocks.loop-data.resumeLastWorkflow') }}
      </ui-checkbox>
    </template>
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
          v-tooltip="t('common.options')"
          :class="{ 'text-primary': state.showOptions }"
          icon
          class="ml-2"
          @click="state.showOptions = !state.showOptions"
        >
          <v-remixicon name="riSettings3Line" />
        </ui-button>
        <p class="flex-1 text-overflow mx-4">{{ file.name }}</p>
        <p>{{ t('workflow.blocks.loop-data.modal.maxFile') }}</p>
      </div>
      <div style="height: calc(100vh - 11rem)">
        <shared-codemirror
          v-show="!state.showOptions"
          :model-value="data.loopData"
          lang="json"
          class="h-full"
          @change="updateLoopData"
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
import { onMounted, shallowReactive, defineAsyncComponent } from 'vue';
import { nanoid } from 'nanoid';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import Papa from 'papaparse';
import { openFilePicker } from '@/utils/helper';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  blockId: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  autocomplete: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const toast = useToast();

const maxFileSize = 1024 * 1024;
const loopTypes = [
  'data-columns',
  'numbers',
  'google-sheets',
  'variable',
  'custom-data',
  'elements',
];

const state = shallowReactive({
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
function updateLoopData(value) {
  if (value.length > maxFileSize) {
    toast.error(t('message.maxSizeExceeded'));
  }

  updateData({ loopData: value.slice(0, maxFileSize) });
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
    .then(async ([fileObj]) => {
      if (fileObj.size > maxFileSize) {
        toast.error(t('message.maxSizeExceeded'));
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
          const loopDataStr = JSON.stringify(loopData, null, 2);

          updateData({ loopData: loopDataStr });
        }
      };

      reader.readAsText(fileObj);
    })
    .catch((error) => {
      console.error(error);
      if (error.message.startsWith('invalid')) toast.error(error.message);
    });
}

onMounted(() => {
  if (!props.data.loopId) {
    updateData({ loopId: nanoid(6) });
  }
});
</script>
