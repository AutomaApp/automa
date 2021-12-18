<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-input
      :model-value="data.attributeName"
      :placeholder="t('workflow.blocks.attribute-value.forms.name')"
      class="mt-3 w-full"
      @change="updateData({ attributeName: $event })"
    />
    <ui-checkbox
      :model-value="data.saveData"
      class="mt-3"
      @change="updateData({ saveData: $event })"
    >
      {{ t('workflow.blocks.attribute-value.forms.checkbox') }}
    </ui-checkbox>
    <div v-if="data.saveData" class="flex items-center mt-1">
      <ui-select
        :model-value="data.dataColumn"
        :placeholder="t('workflow.blocks.attribute-value.forms.column')"
        class="mr-2 flex-1"
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
      <ui-button icon @click="workflow.showDataColumnsModal(true)">
        <v-remixicon name="riKey2Line" />
      </ui-button>
    </div>
    <ui-checkbox
      :model-value="data.addExtraRow"
      class="mt-3"
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
      class="w-full mt-3 mb-2"
      @change="updateData({ extraRowValue: $event })"
    />
    <div v-if="data.addExtraRow" class="flex items-center mt-1">
      <ui-select
        :model-value="data.extraRowDataColumn"
        placeholder="Data column"
        class="mr-2 flex-1"
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
      <ui-button
        icon
        title="Data columns"
        @click="workflow.showDataColumnsModal(true)"
      >
        <v-remixicon name="riKey2Line" />
      </ui-button>
    </div>
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
