<template>
  <edit-interaction-base v-bind="{ data, hide: hideBase }" @change="updateData">
    <hr />
    <ui-checkbox
      :model-value="data.getValue"
      @change="updateData({ getValue: $event })"
    >
      {{ t('workflow.blocks.forms.getValue') }}
    </ui-checkbox>
    <template v-if="data.getValue && !hideBase">
      <ui-checkbox
        :model-value="data.saveData"
        block
        class="mt-4"
        @change="updateData({ saveData: $event })"
      >
        Insert to table
      </ui-checkbox>
      <ui-select
        v-if="data.saveData"
        :model-value="data.dataColumn"
        placeholder="Select column"
        class="w-full mt-2"
        @change="updateData({ dataColumn: $event })"
      >
        <option
          v-for="column in workflow.data.value.table"
          :key="column.name"
          :value="column.name"
        >
          {{ column.name }}
        </option>
      </ui-select>
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
    </template>
    <template v-else>
      <ui-select
        :model-value="data.type"
        class="block w-full mb-2 mt-4"
        :placeholder="t('workflow.blocks.forms.type')"
        @change="updateData({ type: $event })"
      >
        <option v-for="form in forms" :key="form" :value="form">
          {{ t(`workflow.blocks.forms.${form}.name`) }}
        </option>
      </ui-select>
      <ui-checkbox
        v-if="data.type === 'checkbox' || data.type === 'radio'"
        :model-value="data.selected"
        @change="updateData({ selected: $event })"
      >
        {{ t('workflow.blocks.forms.selected') }}
      </ui-checkbox>
      <template v-if="data.type === 'text-field' || data.type === 'select'">
        <ui-textarea
          :model-value="data.value"
          :placeholder="t('workflow.blocks.forms.text-field.value')"
          class="w-full mb-1"
          @change="updateData({ value: $event })"
        />
        <ui-checkbox
          :model-value="data.clearValue"
          @change="updateData({ clearValue: $event })"
        >
          {{ t('workflow.blocks.forms.text-field.clearValue') }}
        </ui-checkbox>
      </template>
      <ui-input
        v-if="data.type === 'text-field'"
        :model-value="data.delay"
        :label="t('workflow.blocks.forms.text-field.delay.label')"
        :placeholder="t('workflow.blocks.forms.text-field.delay.placeholder')"
        class="w-full mt-1"
        min="0"
        type="number"
        @change="updateData({ delay: +$event })"
      />
    </template>
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
  hideBase: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const workflow = inject('workflow');

const forms = ['text-field', 'select', 'checkbox', 'radio'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
