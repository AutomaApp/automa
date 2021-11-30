<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-select
      :model-value="data.type"
      class="block w-full mt-4 mb-3"
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
        class="w-full"
        @change="updateData({ value: $event })"
      />
      <ui-checkbox
        :model-value="data.clearValue"
        class="mb-1 ml-1"
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
      class="w-full"
      min="0"
      type="number"
      @change="updateData({ delay: +$event })"
    />
  </edit-interaction-base>
</template>
<script setup>
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

const forms = ['text-field', 'select', 'checkbox', 'radio'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
