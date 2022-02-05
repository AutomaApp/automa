<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <hr />
    <ui-input
      :model-value="data.attributeName"
      :placeholder="t('workflow.blocks.attribute-value.forms.name')"
      class="w-full"
      @change="updateData({ attributeName: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      block
      class="mt-4"
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
    <ui-checkbox
      :model-value="data.saveData"
      class="mt-4"
      @change="updateData({ saveData: $event })"
    >
      {{ t('workflow.blocks.attribute-value.forms.checkbox') }}
    </ui-checkbox>
    <ui-select
      v-if="data.saveData"
      :model-value="data.dataColumn"
      :placeholder="t('workflow.blocks.attribute-value.forms.column')"
      class="w-full mt-2"
      @change="updateData({ dataColumn: $event })"
    >
      <option
        v-for="column in workflow.data.value.dataColumns"
        :key="column.name"
        :value="column.name"
      >
        {{ column.name }}
      </option>
    </ui-select>
    <ui-checkbox
      :model-value="data.addExtraRow"
      class="mt-4"
      block
      @change="updateData({ addExtraRow: $event })"
    >
      {{ t('workflow.blocks.attribute-value.forms.extraRow.checkbox') }}
    </ui-checkbox>
    <ui-input
      v-if="data.addExtraRow"
      :model-value="data.extraRowValue"
      :title="t('workflow.blocks.attribute-value.forms.extraRow.title')"
      :placeholder="
        t('workflow.blocks.attribute-value.forms.extraRow.placeholder')
      "
      class="w-full mt-2 mb-2"
      @change="updateData({ extraRowValue: $event })"
    />
    <ui-select
      v-if="data.addExtraRow"
      :model-value="data.extraRowDataColumn"
      placeholder="Select column"
      class="mt-1 w-full"
      @change="updateData({ extraRowDataColumn: $event })"
    >
      <option
        v-for="column in workflow.data.value.dataColumns"
        :key="column.name"
        :value="column.name"
      >
        {{ column.name }}
      </option>
    </ui-select>
  </edit-interaction-base>
</template>
<script setup>
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import EditInteractionBase from './EditInteractionBase.vue';

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
