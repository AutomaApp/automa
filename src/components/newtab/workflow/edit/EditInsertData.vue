<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ul v-show="dataList.length > 0" class="mt-4 data-list">
      <li
        v-for="(item, index) in dataList"
        :key="index"
        class="mb-4 pb-4 border-b"
      >
        <div class="flex mb-2">
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
              v-for="column in workflow.data.value.table"
              :key="column.name"
              :value="column.name"
            >
              {{ column.name }}
            </option>
          </ui-select>
        </div>
        <div class="flex items-center">
          <ui-input
            v-model="item.value"
            placeholder="value"
            title="value"
            class="flex-1 mr-2"
          />
          <ui-button icon @click="dataList.splice(index, 1)">
            <v-remixicon name="riDeleteBin7Line" />
          </ui-button>
        </div>
      </li>
    </ul>
    <ui-button class="mt-4" variant="accent" @click="addItem">
      {{ t('common.add') }}
    </ui-button>
  </div>
</template>
<script setup>
import { ref, watch, inject } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const workflow = inject('workflow');
const dataList = ref(JSON.parse(JSON.stringify(props.data.dataList)));

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addItem() {
  dataList.value.push({
    type: 'table',
    name: '',
    value: '',
  });
}
function changeItemType(index, type) {
  dataList.value[index] = {
    ...dataList.value[index],
    type,
    name: '',
  };
}

watch(
  dataList,
  (value) => {
    updateData({ dataList: value });
  },
  { deep: true }
);
</script>
<style scoped>
.data-list li:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: 0;
}
</style>
