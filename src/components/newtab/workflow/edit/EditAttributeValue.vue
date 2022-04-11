<template>
  <edit-interaction-base v-bind="{ data, autocomplete }" @change="updateData">
    <hr />
    <ui-autocomplete
      :items="autocomplete"
      :trigger-char="['{{', '}}']"
      block
      hide-empty
    >
      <ui-input
        :model-value="data.attributeName"
        :label="t('workflow.blocks.attribute-value.forms.name')"
        autocomplete="off"
        placeholder="name"
        class="w-full"
        @change="updateData({ attributeName: $event })"
      />
    </ui-autocomplete>
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
  autocomplete: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
