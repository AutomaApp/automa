<template>
  <edit-interaction-base
    class="mb-8"
    v-bind="{ data, hide: hideBase }"
    @change="updateData"
  >
    <template v-if="hasFileAccess || browserType === 'firefox'">
      <div
        v-if="browserType === 'firefox'"
        class="mt-4 p-2 rounded-lg bg-primary mt-4 flex text-white items-start"
      >
        <v-remixicon name="riErrorWarningLine" size="20" />
        <div class="ml-2 flex-1 leading-tight text-sm">
          <p>{{ t('workflow.blocks.upload-file.onlyURL') }}</p>
        </div>
      </div>
      <div class="mt-4 space-y-2">
        <div
          v-for="(path, index) in filePaths"
          :key="index"
          class="flex items-center group"
        >
          <edit-autocomplete class="mr-2">
            <ui-input
              v-model="filePaths[index]"
              :placeholder="t('workflow.blocks.upload-file.filePath')"
              autocomplete="off"
              class="w-full"
            />
          </edit-autocomplete>
          <v-remixicon
            name="riDeleteBin7Line"
            class="invisible cursor-pointer group-hover:visible"
            @click="filePaths.splice(index, 1)"
          />
        </div>
      </div>
      <ui-button variant="accent" class="mt-2" @click="filePaths.push('')">
        {{ t('workflow.blocks.upload-file.addFile') }}
      </ui-button>
    </template>
    <template v-else>
      <div
        class="mt-4 p-2 rounded-lg bg-red-200 dark:bg-red-400 flex items-start"
      >
        <v-remixicon name="riErrorWarningLine" />
        <div class="ml-2 flex-1 leading-tight">
          <p>{{ t('workflow.blocks.upload-file.noFileAccess') }}</p>
        </div>
      </div>
      <a
        href="https://docs.automa.site/blocks/upload-file.html#requirements"
        target="_blank"
        rel="noopener"
        class="leading-tight inline-block text-primary mt-2"
      >
        {{ t('workflow.blocks.upload-file.requirement') }}
      </a>
    </template>
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';
import browser from 'webextension-polyfill';
import EditInteractionBase from './EditInteractionBase.vue';
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
const browserType = BROWSER_TYPE;

const filePaths = ref([...props.data.filePaths]);
const hasFileAccess = ref(true);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
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
