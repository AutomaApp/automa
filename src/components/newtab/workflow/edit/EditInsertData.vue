<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-button
      class="w-full mt-4 mb-2"
      variant="accent"
      @click="showModal = !showModal"
    >
      Insert data ({{ dataList.length }})
    </ui-button>
    <ui-modal
      v-model="showModal"
      title="Insert data"
      padding="p-0"
      content-class="max-w-3xl insert-data-modal"
    >
      <ul
        class="mt-4 data-list px-4 pb-4 overflow-auto scroll"
        style="max-height: calc(100vh - 13rem)"
      >
        <li
          v-for="(item, index) in dataList"
          :key="index"
          class="mb-4 rounded-lg border"
        >
          <div class="p-2 border-b flex items-center">
            <ui-select
              :model-value="item.type"
              class="mr-2 flex-shrink-0"
              @change="changeItemType(index, $event)"
            >
              <option value="table">
                {{ t('workflow.table.title') }}
              </option>
              <option value="variable">
                {{ t('workflow.variables.title') }}
              </option>
            </ui-select>
            <ui-input
              v-if="item.type === 'variable'"
              v-model="item.name"
              :placeholder="t('workflow.variables.name')"
              :title="t('workflow.variables.name')"
              class="flex-1"
            />
            <ui-select
              v-else
              v-model="item.name"
              :placeholder="t('workflow.table.select')"
            >
              <option
                v-for="column in workflow.columns.value"
                :key="column.id"
                :value="column.id"
              >
                {{ column.name }}
              </option>
            </ui-select>
            <div class="flex-grow" />
            <v-remixicon
              name="riDeleteBin7Line"
              class="cursor-pointer"
              @click="removeItem(index)"
            />
          </div>
          <div class="p-2">
            <div v-if="hasFileAccess && item.isFile" class="flex items-end">
              <edit-autocomplete class="w-full">
                <ui-input
                  v-model="item.filePath"
                  class="w-full"
                  :placeholder="
                    isFirefox ? 'File URL' : 'File absolute path/File URL'
                  "
                />
              </edit-autocomplete>
              <template
                v-if="
                  /.xlsx?$/.test(item.filePath) &&
                  (item.action || item.csvAction)?.includes?.('json')
                "
              >
                <ui-input
                  v-model="item.xlsSheet"
                  label="Sheet (optional)"
                  class="ml-2"
                  placeholder="Sheet1"
                />
                <ui-input
                  v-model="item.xlsRange"
                  label="Range (optional)"
                  class="ml-2"
                  placeholder="A1:C10"
                />
              </template>
            </div>
            <edit-autocomplete v-else class="w-full">
              <ui-textarea
                v-model="item.value"
                placeholder="value"
                title="value"
                class="w-full"
              />
            </edit-autocomplete>
            <div class="flex mt-2 items-center">
              <ui-button
                v-tooltip="
                  hasFileAccess
                    ? 'Import file'
                    : 'Don\'t have access, click to learn more'
                "
                :class="{ 'text-primary': item.isFile }"
                icon
                @click="setAsFile(item)"
              >
                <v-remixicon name="riFileLine" />
              </ui-button>
              <template v-if="hasFileAccess && item.isFile">
                <ui-button class="ml-2" @click="previewData(index, item)">
                  Preview data
                </ui-button>
                <ui-button
                  v-if="previewState.itemId === index"
                  v-tooltip="'Clear preview'"
                  class="ml-2"
                  icon
                  @click="clearPreview"
                >
                  <v-remixicon name="riBrush2Line" />
                </ui-button>
                <div class="flex-grow" />
                <ui-select
                  :model-value="item.action || item.csvAction"
                  placeholder="File Action"
                  @change="item.action = $event"
                >
                  <option value="default">Default</option>
                  <option value="base64">Read as base64</option>
                  <optgroup
                    v-if="/.(csv|xlsx?)$/.test(item.filePath)"
                    label="CSV/Excel File"
                  >
                    <option value="json">Read as JSON</option>
                    <option value="json-header">
                      Read as JSON with headers
                    </option>
                  </optgroup>
                </ui-select>
              </template>
            </div>
            <shared-codemirror
              v-if="previewState.itemId === index"
              :model-value="previewState.data"
              readonly
              hide-lang
              class="w-full mt-4"
              lang="json"
              style="max-height: 500px"
            />
          </div>
        </li>
        <ui-button class="mt-4 w-24" variant="accent" @click="addItem">
          {{ t('common.add') }}
        </ui-button>
      </ul>
    </ui-modal>
  </div>
</template>
<script setup>
import { ref, watch, inject, shallowReactive, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { read as readXlsx, utils as utilsXlsx } from 'xlsx';
import Papa from 'papaparse';
import browser from 'webextension-polyfill';
import getFile, { readFileAsBase64 } from '@/utils/getFile';
import EditAutocomplete from './EditAutocomplete.vue';

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

const isFirefox = BROWSER_TYPE === 'firefox';

const { t } = useI18n();
const toast = useToast();

const workflow = inject('workflow', {});

const showModal = ref(false);
const hasFileAccess = ref(false);
const dataList = ref(JSON.parse(JSON.stringify(props.data.dataList)));

const previewState = shallowReactive({
  data: '',
  itemId: '',
});

function clearPreview() {
  previewState.itemId = '';
  previewState.data = '';
}
function removeItem(index) {
  dataList.value.splice(index, 1);
  clearPreview();
}
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addItem() {
  dataList.value.push({
    type: 'table',
    name: '',
    value: '',
    filePath: '',
    isFile: false,
    action: 'default',
  });
}
function changeItemType(index, type) {
  dataList.value[index] = {
    ...dataList.value[index],
    type,
    name: '',
  };
}
function setAsFile(item) {
  if (!hasFileAccess.value) {
    window.open('https://docs.automa.site/blocks/insert-data.html#import-file');
    return;
  }

  item.isFile = !item.isFile;
}
async function previewData(index, item) {
  try {
    const path = item.filePath || '';
    const isExcel = /.xlsx?$/.test(path);
    const isJSON = path.endsWith('.json');

    const action = item.action || item.csvAction || 'default';
    let responseType = 'text';

    if (isJSON) responseType = 'json';
    else if (action === 'base64' || (isExcel && action !== 'default'))
      responseType = 'blob';

    let result = await getFile(path, {
      responseType,
      returnValue: true,
    });

    const readAsJson = action.includes('json');

    if (action === 'base64') {
      result = await readFileAsBase64(result);
    } else if (result && path.endsWith('.csv') && readAsJson) {
      const parsedCSV = Papa.parse(result, {
        header: action.includes('header'),
      });
      result = JSON.stringify(parsedCSV.data || [], null, 2);
    } else if (isJSON) {
      result = JSON.stringify(result, null, 2);
    } else if (isExcel && readAsJson) {
      const base64Xls = await readFileAsBase64(result);
      const wb = readXlsx(base64Xls.slice(base64Xls.indexOf(',')), {
        type: 'base64',
      });

      const inputtedSheet = (item.xlsSheet || '').trim();
      const sheetName = wb.SheetNames.includes(inputtedSheet)
        ? inputtedSheet
        : wb.SheetNames[0];

      const options = {};
      if (item.xlsRange) options.range = item.xlsRange;
      if (!action.includes('header')) options.header = 1;

      const sheetData = utilsXlsx.sheet_to_json(wb.Sheets[sheetName], options);
      result = JSON.stringify(sheetData, null, 2);
    }

    previewState.itemId = index;
    previewState.data = result;
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

browser.extension.isAllowedFileSchemeAccess().then((value) => {
  hasFileAccess.value = isFirefox ? true : value;
});

watch(
  dataList,
  (value) => {
    updateData({ dataList: value });
  },
  { deep: true }
);
</script>
<style>
.insert-data-modal .modal-ui__content-header {
  @apply p-4;
}
</style>
