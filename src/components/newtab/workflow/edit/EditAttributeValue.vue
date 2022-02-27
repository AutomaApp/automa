<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <hr />
    <ui-input
      :model-value="data.attributeName"
      :label="t('workflow.blocks.attribute-value.forms.name')"
      placeholder="name"
      class="w-full"
      @change="updateData({ attributeName: $event })"
    />
    <insert-workflow-data
      :data="data"
      extra-row
      variables
      @update="updateData"
    />
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import EditInteractionBase from './EditInteractionBase.vue';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
