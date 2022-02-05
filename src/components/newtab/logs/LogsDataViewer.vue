<template>
  <div class="flex items-center mb-2">
    <ui-input
      v-model="state.fileName"
      :placeholder="t('common.fileName')"
      :title="t('common.fileName')"
    />
    <div class="flex-grow"></div>
    <ui-popover>
      <template #trigger>
        <ui-button variant="accent">
          <span>{{ t('log.exportData.title') }}</span>
          <v-remixicon name="riArrowDropDownLine" class="ml-2 -mr-1" />
        </ui-button>
      </template>
      <ui-list class="space-y-1">
        <ui-list-item
          v-for="type in dataExportTypes"
          :key="type.id"
          v-close-popover
          class="cursor-pointer"
          @click="exportData(type.id)"
        >
          {{ t(`log.exportData.types.${type.id}`) }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </div>
  <ui-tabs v-if="objectHasKey(log.data, 'table')" v-model="state.activeTab">
    <ui-tab value="table">
      {{ t('workflow.table.title') }}
    </ui-tab>
    <ui-tab value="variables">
      {{ t('workflow.variables.title') }}
    </ui-tab>
  </ui-tabs>
  <shared-codemirror
    :model-value="dataStr"
    :class="editorClass"
    lang="json"
    readonly
  />
</template>
<script setup>
import { shallowReactive, computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { dataExportTypes } from '@/utils/shared';
import { objectHasKey } from '@/utils/helper';
import dataExporter from '@/utils/data-exporter';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  log: {
    type: Object,
    default: () => ({}),
  },
  editorClass: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();

const state = shallowReactive({
  activeTab: 'table',
  fileName: props.log.name,
});
const cache = {
  table: '',
  variables: '',
};

const dataStr = computed(() => {
  if (cache[state.activeTab]) return cache[state.activeTab];

  let { data } = props.log;

  if (objectHasKey(props.log.data, 'table')) {
    data = props.log.data[state.activeTab];
  }

  data = JSON.stringify(data, null, 2);
  /* eslint-disable-next-line */
  cache[state.activeTab] = data;

  return data;
});

function exportData(type) {
  dataExporter(props.log.data, { name: state.fileName, type }, true);
}
</script>
