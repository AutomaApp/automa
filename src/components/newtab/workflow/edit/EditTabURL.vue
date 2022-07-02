<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.type"
      :label="t('workflow.blocks.tab-url.select')"
      class="mt-4 w-full"
      @change="updateData({ type: $event })"
    >
      <option v-for="type in types" :key="type" :value="type">
        {{ t(`workflow.blocks.tab-url.types.${type}`) }}
      </option>
    </ui-select>
    <insert-workflow-data :data="data" variables @update="updateData" />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const types = ['active-tab', 'all'];
const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
<style>
.log-data .block-variable {
  margin-top: 4px;
}
</style>
