<template>
  <template v-if="variables">
    <ui-checkbox
      :model-value="data.assignVariable"
      block
      class="mt-4 block-variable"
      @change="updateData({ assignVariable: $event })"
    >
      {{ t('workflow.variables.assign') }}
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      :placeholder="t('workflow.variables.name')"
      :title="t('workflow.variables.name')"
      class="mt-2 w-full"
      @change="updateData({ variableName: $event })"
    />
  </template>
  <template v-if="table && !workflow?.isPackage && workflow.columns?.value">
    <ui-checkbox
      :model-value="data.saveData"
      block
      class="mt-4"
      @change="updateData({ saveData: $event })"
    >
      {{ t('workflow.blocks.base.table.checkbox') }}
    </ui-checkbox>
    <ui-select
      v-if="data.saveData"
      :model-value="data.dataColumn"
      :placeholder="t('workflow.blocks.base.table.select')"
      class="w-full mt-2"
      @change="updateData({ dataColumn: $event })"
    >
      <option
        v-for="column in [...columns, ...workflow.columns.value]"
        :key="column.id"
        :value="column.id"
      >
        {{ column.name }}
      </option>
    </ui-select>
  </template>
  <template v-if="extraRow">
    <ui-checkbox
      :model-value="data.addExtraRow"
      class="mt-4"
      block
      @change="updateData({ addExtraRow: $event })"
    >
      {{ t('workflow.blocks.base.table.extraRow.checkbox') }}
    </ui-checkbox>
    <template v-if="data.addExtraRow">
      <ui-input
        :model-value="data.extraRowValue"
        :title="t('workflow.blocks.base.table.extraRow.title')"
        :placeholder="t('workflow.blocks.base.table.extraRow.placeholder')"
        class="w-full mt-2 mb-2"
        @change="updateData({ extraRowValue: $event })"
      />
      <ui-select
        :model-value="data.extraRowDataColumn"
        placeholder="Select column"
        class="mt-1 w-full"
        @change="updateData({ extraRowDataColumn: $event })"
      >
        <option
          v-for="column in [...columns, ...workflow.columns.value]"
          :key="column.id"
          :value="column.id"
        >
          {{ column.name }}
        </option>
      </ui-select>
    </template>
  </template>
</template>
<script setup>
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  table: {
    type: Boolean,
    default: true,
  },
  extraRow: Boolean,
  variables: Boolean,
  columns: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();
const workflow = inject('workflow', {});

function updateData(data) {
  emit('update', data);
}
</script>
