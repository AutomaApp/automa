<template>
  <edit-interaction-base v-bind="{ data, hide: hideBase }" @change="updateData">
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
        class="mb-2 mt-4 block w-full"
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
      <template v-if="data.type === 'text-field'">
        <edit-autocomplete class="mb-1 w-full">
          <ui-textarea
            :model-value="data.value"
            :placeholder="t('workflow.blocks.forms.text-field.value')"
            class="w-full"
            @change="updateData({ value: $event })"
          />
        </edit-autocomplete>
        <ui-checkbox
          :model-value="data.clearValue"
          @change="updateData({ clearValue: $event })"
        >
          {{ t('workflow.blocks.forms.text-field.clearValue') }}
        </ui-checkbox>
      </template>
      <template v-if="data.type === 'select'">
        <ui-select
          :model-value="data.selectOptionBy"
          :label="t('workflow.blocks.forms.selectOptionBy')"
          class="w-full"
          @change="updateData({ selectOptionBy: $event })"
        >
          <option value="value">
            {{ t('workflow.blocks.forms.selectByValue') }}
          </option>
          <optgroup :label="t('workflow.blocks.forms.positionGroup')">
            <option value="first-option">
              {{ t('workflow.blocks.forms.firstOption') }}
            </option>
            <option value="last-option">
              {{ t('workflow.blocks.forms.lastOption') }}
            </option>
            <option value="custom-position">
              {{ t('workflow.blocks.forms.customPosition') }}
            </option>
          </optgroup>
        </ui-select>
        <div v-if="data.selectOptionBy === 'value'" class="mt-2">
          <edit-autocomplete class="mb-1 w-full">
            <ui-textarea
              :model-value="data.value"
              :placeholder="t('workflow.blocks.forms.text-field.value')"
              class="w-full"
              @change="updateData({ value: $event })"
            />
          </edit-autocomplete>
          <ui-checkbox
            :model-value="data.clearValue"
            @change="updateData({ clearValue: $event })"
          >
            {{ t('workflow.blocks.forms.text-field.clearValue') }}
          </ui-checkbox>
        </div>
        <ui-input
          v-else-if="data.selectOptionBy === 'custom-position'"
          :model-value="data.optionPosition"
          :label="t('workflow.blocks.forms.optionPosition')"
          placeholder="0"
          class="mt-2 w-full"
          @change="updateData({ optionPosition: $event })"
        />
      </template>
      <ui-input
        v-if="data.type === 'text-field'"
        :model-value="data.delay"
        :label="t('workflow.blocks.forms.text-field.delay.label')"
        :placeholder="t('workflow.blocks.forms.text-field.delay.placeholder')"
        class="mt-1 w-full"
        min="0"
        @change="updateData({ delay: $event })"
      />
    </template>
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import InsertWorkflowData from './InsertWorkflowData.vue';
import EditInteractionBase from './EditInteractionBase.vue';
import EditAutocomplete from './EditAutocomplete.vue';

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

const forms = ['text-field', 'select', 'checkbox', 'radio'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
