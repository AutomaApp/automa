<template>
  <edit-interaction-base
    v-bind="{ data, hide: hideBase, autocomplete }"
    @change="updateData"
  >
    <hr />
    <ui-checkbox
      :model-value="data.getValue"
      @change="updateData({ getValue: $event })"
    >
      {{ t('workflow.blocks.forms.getValue') }}
    </ui-checkbox>
    <insert-workflow-data
      v-if="data.getValue && !hideBase"
      :data="data"
      variables
      @update="updateData"
    />
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
        <ui-autocomplete
          :items="autocomplete"
          :trigger-char="['{{', '}}']"
          block
          hide-empty
          class="w-full mb-1"
        >
          <ui-textarea
            :model-value="data.value"
            :placeholder="t('workflow.blocks.forms.text-field.value')"
            class="w-full"
            @change="updateData({ value: $event })"
          />
        </ui-autocomplete>
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
import { useI18n } from 'vue-i18n';
import InsertWorkflowData from './InsertWorkflowData.vue';
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
  autocomplete: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const forms = ['text-field', 'select', 'checkbox', 'radio'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
