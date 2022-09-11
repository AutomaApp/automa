<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.type"
      label="Action"
      class="w-full mt-4"
      @change="updateData({ type: $event })"
    >
      <optgroup v-for="action in actions" :key="action.id" :label="action.name">
        <option
          v-for="item in actionsItems[action.id]"
          :key="item.id"
          :value="item.id"
        >
          {{ item.name }}
        </option>
      </optgroup>
    </ui-select>
    <ui-checkbox
      v-if="includeExceptions.includes(data.type)"
      :model-value="data.exceptCurrent"
      class="mt-2"
      @change="updateData({ exceptCurrent: $event })"
    >
      Execpt for the current workflow
    </ui-checkbox>
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

const includeExceptions = ['stop-all'];
const actions = [
  { id: 'stop', name: t('workflow.blocks.workflow-state.actions.stop') },
];
const actionsItems = {
  stop: [
    { id: 'stop-all', name: 'Stop all workflows' },
    { id: 'stop-current', name: 'Stop current workflow' },
    // { id: 'stop-specific', name: 'Stop specific workflows' },
  ],
};

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
