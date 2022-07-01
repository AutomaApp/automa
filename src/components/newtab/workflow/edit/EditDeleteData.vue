<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ul class="delete-list mt-4">
      <li
        v-for="(item, index) in deleteList"
        :key="item.id"
        class="mb-2 pb-4 border-b"
      >
        <div class="flex items-end space-x-2">
          <ui-select
            v-model="deleteList[index].type"
            :label="t('workflow.blocks.delete-data.from')"
            class="flex-1"
          >
            <option v-for="type in types" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </ui-select>
          <ui-button icon @click="deleteList.splice(index, 1)">
            <v-remixicon name="riDeleteBin7Line" />
          </ui-button>
        </div>
        <ui-input
          v-if="item.type === 'variable'"
          v-model="deleteList[index].variableName"
          :placeholder="t('workflow.variables.name')"
          :title="t('workflow.variables.name')"
          autocomplete="off"
          class="w-full mt-2"
        />
        <ui-select
          v-else
          v-model="deleteList[index].columnId"
          :label="t('workflow.table.select')"
          class="w-full mt-1"
        >
          <option value="[all]">
            {{ t('workflow.blocks.delete-data.allColumns') }}
          </option>
          <option value="column">Column</option>
          <option
            v-for="column in workflow.columns.value"
            :key="column.id"
            :value="column.id"
          >
            {{ column.name }}
          </option>
        </ui-select>
      </li>
    </ul>
    <ui-button class="my-4" variant="accent" @click="addItem">
      {{ t('common.add') }}
    </ui-button>
  </div>
</template>
<script setup>
import { inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import cloneDeep from 'lodash.clonedeep';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const workflow = inject('workflow', {});
const deleteList = ref(cloneDeep(props.data.deleteList));

const types = [
  { id: 'table', name: t('workflow.table.title') },
  { id: 'variable', name: t('workflow.variables.title') },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addItem() {
  deleteList.value.push({
    type: 'table',
    variableName: '',
    columnId: '[all]',
  });
}

watch(
  deleteList,
  (value) => {
    updateData({ deleteList: value });
  },
  { deep: true }
);
</script>
<style scoped>
.delete-list li:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: 0;
}
</style>
