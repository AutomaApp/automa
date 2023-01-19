<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.action"
      class="w-full mt-4"
      @change="updateData({ action: $event })"
    >
      <option v-for="action in actions" :key="action" :value="action">
        {{ t(`workflow.blocks.google-drive.actions.${action}`) }}
      </option>
    </ui-select>
    <div class="mt-4">
      <ul class="space-y-2">
        <li
          v-for="(item, index) in filePaths"
          :key="item.id"
          class="p-2 border rounded-lg"
        >
          <div class="flex items-center">
            <ui-select
              v-model="item.type"
              class="grow mr-2"
              placeholder="File location"
            >
              <option value="url">URL</option>
              <option value="local" :disabled="!hasFileAccess">
                Local computer
              </option>
              <option value="downloadId" :disabled="!permissions.has.downloads">
                Download id
              </option>
            </ui-select>
            <ui-button icon @click="filePaths.splice(index, 1)">
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>
          <edit-autocomplete>
            <ui-input
              v-model="item.name"
              placeholder="Filename (optional)"
              class="w-full mt-2"
            />
          </edit-autocomplete>
          <edit-autocomplete>
            <ui-input
              v-model="item.path"
              :placeholder="placeholders[item.type]"
              title="File location"
              class="w-full mt-2"
            />
          </edit-autocomplete>
        </li>
      </ul>
      <ui-button class="mt-4" variant="accent" @click="addFile">
        Add file
      </ui-button>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid/non-secure';
import cloneDeep from 'lodash.clonedeep';
import browser from 'webextension-polyfill';
import { useHasPermissions } from '@/composable/hasPermissions';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  hideBase: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const actions = ['upload'];
const placeholders = {
  downloadId: '0',
  local: 'C:\\file.zip',
  url: 'https://example.com/file.zip',
};

const permissions = useHasPermissions(['downloads']);

const filePaths = ref(cloneDeep(props.data.filePaths));
const hasFileAccess = ref(true);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addFile() {
  filePaths.value.push({ path: '', type: 'url', name: '', id: nanoid(5) });
}

browser.extension.isAllowedFileSchemeAccess().then((value) => {
  hasFileAccess.value = value;
});

watch(
  filePaths,
  (paths) => {
    updateData({ filePaths: paths });
  },
  { deep: true }
);
</script>
