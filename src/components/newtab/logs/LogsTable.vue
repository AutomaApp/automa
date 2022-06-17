<template>
  <div v-if="tableData.body.length === 0" class="text-center">
    <img src="@/assets/svg/files-and-folder.svg" class="mx-auto max-w-sm" />
    <p class="text-xl font-semibold">{{ t('message.noData') }}</p>
  </div>
  <template v-else>
    <div class="flex items-center">
      <ui-tabs
        v-model="state.activeTab"
        type="fill"
        class="mb-4"
        color=""
        style="padding: 0"
      >
        <ui-tab value="table"> Table </ui-tab>
        <ui-tab value="raw"> Raw </ui-tab>
      </ui-tabs>
      <div class="flex-grow"></div>
      <ui-input
        v-if="state.activeTab === 'table'"
        v-model="state.query"
        :placeholder="t('common.search')"
        class="mr-4"
        prepend-icon="riSearch2Line"
        type="search"
      />
      <ui-popover trigger-width>
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
    <shared-codemirror
      v-show="state.activeTab === 'raw'"
      :model-value="JSON.stringify(currentLog.data.table, null, 2)"
      readonly
      lang="json"
      style="max-height: 600px"
    />
    <ui-table
      v-show="state.activeTab === 'table'"
      :headers="tableData.header"
      :items="rows"
      :search="state.query"
      item-key="id"
      class="w-full"
    />
    <div
      v-if="
        state.activeTab === 'table' &&
        tableData.body &&
        tableData.body.length >= 10
      "
      class="flex items-center justify-between mt-4"
    >
      <div>
        {{ t('components.pagination.text1') }}
        <select v-model="pagination.perPage" class="p-1 rounded-md bg-input">
          <option
            v-for="num in [10, 15, 25, 50, 100, 150]"
            :key="num"
            :value="num"
          >
            {{ num }}
          </option>
        </select>
        {{
          t('components.pagination.text2', {
            count: tableData.body.length,
          })
        }}
      </div>
      <ui-pagination
        v-model="pagination.currentPage"
        :per-page="pagination.perPage"
        :records="tableData.body.length"
      />
    </div>
  </template>
</template>
<script setup>
import { computed, shallowReactive, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { dataExportTypes } from '@/utils/shared';
import dataExporter from '@/utils/dataExporter';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  tableData: {
    type: Object,
    default: () => ({}),
  },
  currentLog: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();

const state = shallowReactive({
  query: '',
  activeTab: 'table',
});
const pagination = shallowReactive({
  perPage: 10,
  currentPage: 1,
});
const rows = computed(() =>
  props.tableData.body.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  )
);

function exportData(type) {
  dataExporter(
    props.currentLog.data.table,
    { name: props.currentLog.name, type },
    true
  );
}
</script>
