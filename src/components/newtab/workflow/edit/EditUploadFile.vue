<template>
  <edit-interaction-base v-bind="{ data, hide: hideBase }" @change="updateData">
    <template v-if="hasFileAccess">
      <div class="mt-4 space-y-2">
        <div
          v-for="(path, index) in filePaths"
          :key="index"
          class="flex items-center group"
        >
          <ui-input
            v-model="filePaths[index]"
            :placeholder="t('workflow.blocks.upload-file.filePath')"
            class="mr-2"
          />
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
      <div class="mt-4 p-2 rounded-lg bg-red-200 flex items-start">
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
import EditInteractionBase from './EditInteractionBase.vue';

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

const filePaths = ref([...props.data.filePaths]);
const hasFileAccess = ref(true);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

chrome.extension.isAllowedFileSchemeAccess((value) => {
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
