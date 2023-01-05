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
    <div v-if="data.type === 'all'" class="mt-4 p-2 rounded-lg border">
      <p class="text-sm text-gray-600">
        {{ t('workflow.blocks.tab-url.query.title') }}
      </p>
      <ui-input
        :model-value="data.qMatchPatterns"
        class="mt-2 w-full"
        placeholder="https://example.com/*"
        @change="updateData({ qMatchPatterns: $event })"
      >
        <template #label>
          {{ t('workflow.blocks.tab-url.query.matchPatterns') }}
        </template>
      </ui-input>
      <ui-input
        :model-value="data.qTitle"
        :label="t('workflow.blocks.tab-url.query.tabTitle')"
        class="mt-2 w-full"
        @change="updateData({ qTitle: $event })"
      />
    </div>
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
