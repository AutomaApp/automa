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
      class="w-full mt-4"
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
    <ui-button
      variant="accent"
      class="mt-4 w-full"
      @click="state.showModal = true"
    >
      {{ t('workflow.blocks.data-mapping.edit') }}
    </ui-button>
    <insert-workflow-data :data="data" variables @update="updateData" />
    <ui-modal
      v-model="state.showModal"
      :title="t('workflow.blocks.data-mapping.edit')"
      content-class="max-w-2xl data-map"
    >
      <div
        class="px-4 my-4 overflow-auto scroll"
        style="min-height: 400px; max-height: calc(100vh - 12rem)"
      >
        <table class="w-full">
          <thead>
            <tr class="bg-box-transparent">
              <th class="w-6/12 rounded-l-lg">
                {{ t('workflow.blocks.data-mapping.source') }}
              </th>
              <th class="w-6/12 rounded-r-lg">
                {{ t('workflow.blocks.data-mapping.destination') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(source, index) in state.sources" :key="source.id">
              <td class="align-baseline group relative pr-4">
                <div class="flex items-center space-x-2">
                  <ui-autocomplete
                    :items="state.autocompleteItems"
                    :disabled="data.dataSource !== 'table'"
                  >
                    <ui-input
                      :model-value="source.name"
                      class="flex-1"
                      placeholder="Source property"
                      @blur="updateSource({ index, source, event: $event })"
                    />
                  </ui-autocomplete>
                  <v-remixicon
                    name="riDeleteBin7Line"
                    class="invisible group-hover:visible cursor-pointer"
                    @click="state.sources.splice(index, 1)"
                  />
                  <v-remixicon
                    name="riArrowLeftLine"
                    rotate="180"
                    class="absolute -right-2 top-4 text-gray-600 dark:text-gray-300"
                  />
                </div>
              </td>
              <td class="align-baseline pl-4">
                <ul class="space-y-1">
                  <li
                    v-for="(destination, destIndex) in source.destinations"
                    :key="destination.id"
                    class="flex items-center space-x-2 group"
                  >
                    <ui-input
                      :model-value="destination.name"
                      class="flex-1"
                      placeholder="Destination property"
                      @blur="
                        updateDestination({
                          index,
                          destIndex,
                          destination,
                          event: $event,
                        })
                      "
                    />
                    <v-remixicon
                      name="riDeleteBin7Line"
                      class="invisible group-hover:visible cursor-pointer"
                      @click="
                        state.sources[index].destinations.splice(destIndex, 1)
                      "
                    />
                  </li>
                </ul>
                <ui-button
                  icon
                  class="mt-2 text-sm"
                  @click="addDestination(index)"
                >
                  {{ t('workflow.blocks.data-mapping.addDestination') }}
                </ui-button>
              </td>
            </tr>
            <tr>
              <td>
                <ui-button class="text-sm" @click="addSource">
                  {{ t('workflow.blocks.data-mapping.addSource') }}
                </ui-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { reactive, onMounted, inject, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import { debounce } from '@/utils/helper';
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

const state = reactive({
  query: '',
  showModal: false,
  autocompleteItems: [],
  sources: [...props.data.sources],
});

function isNameDuplicate({ items, currItem, newName, event }) {
  const isDuplicate = items.some(
    (item) => currItem.id !== item.id && item.name === newName
  );

  if (isDuplicate || !newName) {
    event.target.value = currItem.name;
    return true;
  }

  return false;
}
function updateSource({ index, source, event }) {
  const newName = event.target.value.trim();
  const isDuplicate = isNameDuplicate({
    event,
    newName,
    currItem: source,
    items: state.sources,
  });

  if (isDuplicate) return;

  state.sources[index].name = newName;
}
function updateDestination({ index, destIndex, destination, event }) {
  const newName = event.target.value.trim();
  const sourceDests = state.sources[index].destinations;
  const isDuplicate = isNameDuplicate({
    event,
    newName,
    items: sourceDests,
    currItem: destination,
  });

  if (isDuplicate) return;

  sourceDests[destIndex].name = newName;
}
function addSource() {
  const id = nanoid(4);

  state.sources.push({
    id,
    destinations: [],
    name: `source_${id}`,
  });
}
function addDestination(sourceIndex) {
  const id = nanoid(4);

  state.sources[sourceIndex].destinations.push({
    id,
    name: `dest_${id}`,
  });
}
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

watch(
  () => state.sources,
  debounce(() => {
    updateData({ sources: state.sources });
  }, 200),
  { deep: true }
);

onMounted(() => {
  state.autocompleteItems = workflow.columns.value.map(({ name }) => name);
});
</script>
<style>
.data-map {
  padding: 0 !important;
  .modal-ui__content-header {
    @apply px-4 pt-4;
  }
}
</style>
