<template>
  <edit-interaction-base v-bind="{ data, hide: hideBase }" @change="updateData">
    <ui-checkbox
      :model-value="data.getValue"
      class="mt-2"
      @change="updateData({ getValue: $event })"
    >
      {{ t('workflow.blocks.forms.getValue') }}
    </ui-checkbox>
    <template v-if="data.getValue && !hideBase">
      <ui-checkbox
        :model-value="data.saveData"
        class="mb-2 ml-2"
        @change="updateData({ saveData: $event })"
      >
        Save data
      </ui-checkbox>
      <div class="flex items-center">
        <ui-select
          :model-value="data.dataColumn"
          placeholder="Data column"
          class="mr-2 flex-1"
          @change="updateData({ dataColumn: $event })"
        >
          <option
            v-for="column in workflow.data.value.dataColumns"
            :key="column.name"
            :value="column.name"
          >
            {{ column.name }}
          </option>
        </ui-select>
        <ui-button
          icon
          title="Data columns"
          @click="workflow.showDataColumnsModal(true)"
        >
          <v-remixicon name="riKey2Line" />
        </ui-button>
      </div>
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
          class="w-full"
          @change="updateData({ value: $event })"
        />
        <ui-checkbox
          :model-value="data.clearValue"
          class="mb-2 ml-1"
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
