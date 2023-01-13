<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :label="t('workflow.blocks.data-mapping.dataSource')"
      :model-value="data.dataSource"
      class="mt-4 w-full"
      @change="updateData({ dataSource: $event })"
    >
      <option v-for="source in dataSources" :key="source.id" :value="source.id">
        {{ source.name }}
      </option>
    </ui-select>
    <ui-input
      v-if="data.dataSource === 'variable'"
      :model-value="data.varSourceName"
      :placeholder="t('workflow.variables.name')"
      :title="t('workflow.variables.name')"
      class="mt-2 w-full"
      @change="updateData({ varSourceName: $event })"
    />
    <label class="mt-4 flex items-center">
      <ui-switch
        :model-value="data.sortByProperty"
        @change="updateData({ sortByProperty: $event })"
      />
      <span class="ml-2">
        {{ t('workflow.blocks.sort-data.property') }}
      </span>
    </label>
    <template v-if="data.sortByProperty">
      <ul
        v-for="(property, index) in properties"
        :key="index"
        class="mt-4 space-y-1 divide-y"
      >
        <li class="sort-property">
          <ui-autocomplete
            :model-value="property.name"
            :items="columns"
            :disabled="data.dataSource !== 'table'"
            class="w-full"
          >
            <ui-input
              v-model="property.name"
              autocomplete="off"
              :placeholder="`Property ${index + 1}`"
              class="w-full"
            />
          </ui-autocomplete>
          <div class="mt-2 flex items-center">
            <ui-select v-model="property.order" class="flex-1">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </ui-select>
            <ui-button class="ml-2" icon @click="properties.splice(index, 1)">
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>
        </li>
      </ul>
      <ui-button
        v-if="properties.length < 3"
        variant="accent"
        class="mt-4 text-sm"
        @click="addProperty"
      >
        {{ t('workflow.blocks.sort-data.addProperty') }}
      </ui-button>
    </template>
    <div class="mt-6">
      <insert-workflow-data :data="data" variables @update="updateData" />
    </div>
  </div>
</template>
<script setup>
import { inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import cloneDeep from 'lodash.clonedeep';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const dataSources = [
  { id: 'table', name: t('workflow.table.title') },
  { id: 'variable', name: t('workflow.variables.title') },
];

const workflow = inject('workflow');
const columns = workflow.columns.value.map(({ name }) => name);

const properties = ref(cloneDeep(props.data.itemProperties));

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addProperty() {
  properties.value.push({
    name: '',
    order: 'asc',
  });
}

watch(
  properties,
  (value) => {
    updateData({ itemProperties: value });
  },
  { deep: true }
);
</script>
<style>
.sort-property .ui-popover__trigger {
  width: 100%;
}
</style>
