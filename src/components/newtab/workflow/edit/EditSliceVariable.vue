<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.variableName"
      :label="t('workflow.variables.name')"
      :title="t('workflow.variables.name')"
      class="mt-2 w-full"
      @change="updateData({ variableName: $event })"
    />
    <ul class="mt-4 space-y-2">
      <li v-for="param in params" :key="param.id">
        <ui-checkbox
          :model-value="data[param.toggleKey]"
          @change="updateData({ [param.toggleKey]: $event })"
        >
          {{ t(`workflow.blocks.slice-variable.${param.text}`) }}
        </ui-checkbox>
        <ui-input
          v-if="data[param.toggleKey]"
          :model-value="data[param.id]"
          placeholder="0"
          type="number"
          class="mb-2 w-full"
          @change="updateData({ [param.id]: +$event })"
        />
      </li>
    </ul>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const params = [
  { id: 'startIndex', text: 'start', toggleKey: 'startIdxEnabled' },
  { id: 'endIndex', text: 'end', toggleKey: 'endIdxEnabled' },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
<style>
.log-data .block-variable {
  margin-top: 4px;
}
</style>
