<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <hr />
    <ui-select
      :label="t('common.action')"
      :model-value="data.action || 'get'"
      class="mt-2 w-full"
      @change="updateData({ action: $event })"
    >
      <option v-for="action in ['get', 'set']" :key="action" :value="action">
        {{ t(`workflow.blocks.attribute-value.forms.action.${action}`) }}
      </option>
    </ui-select>
    <edit-autocomplete class="mt-2">
      <ui-input
        :model-value="data.attributeName"
        :label="t('workflow.blocks.attribute-value.forms.name')"
        autocomplete="off"
        placeholder="name"
        class="w-full"
        @change="updateData({ attributeName: $event })"
      />
    </edit-autocomplete>
    <edit-autocomplete v-if="data.action === 'set'" class="mt-2">
      <ui-input
        :model-value="data.attributeValue"
        :label="t('workflow.blocks.attribute-value.forms.value')"
        autocomplete="off"
        placeholder="value"
        class="w-full"
        @change="updateData({ attributeValue: $event })"
      />
    </edit-autocomplete>
    <insert-workflow-data
      v-else
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
import EditAutocomplete from './EditAutocomplete.vue';

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
