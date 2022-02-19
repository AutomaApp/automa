<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full mb-2"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.rowValue"
      :title="t('workflow.blocks.add-row.title')"
      :placeholder="t('workflow.blocks.add-row.placeholder')"
      class="w-full my-2"
      @change="updateData({ rowValue: $event })"
    />
    <ui-select
      :model-value="data.rowDataColumn"
      placeholder="Select column"
      class="w-full"
      @change="updateData({ rowDataColumn: $event })"
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
</template>
<script setup>
import { inject } from 'vue';
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

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
