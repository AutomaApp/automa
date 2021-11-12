<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-select
      :model-value="data.type"
      class="block w-full mt-4 mb-3"
      placeholder="Form type"
      @change="updateData({ type: $event })"
    >
      <option v-for="form in forms" :key="form.id" :value="form.id">
        {{ form.name }}
      </option>
    </ui-select>
    <ui-checkbox
      v-if="data.type === 'checkbox' || data.type === 'radio'"
      :model-value="data.selected"
      @change="updateData({ selected: $event })"
    >
      Selected
    </ui-checkbox>
    <template v-if="data.type === 'text-field' || data.type === 'select'">
      <ui-textarea
        :model-value="data.value"
        placeholder="Value"
        class="w-full"
        @change="updateData({ value: $event })"
      />
      <ui-checkbox
        :model-value="data.clearValue"
        class="mb-1 ml-1"
        @change="updateData({ clearValue: $event })"
      >
        Clear form value
      </ui-checkbox>
    </template>
    <ui-input
      v-if="data.type === 'text-field'"
      :model-value="data.delay"
      label="Typing delay (millisecond)(0 to disable)"
      placeholder="Delay"
      class="w-full"
      min="0"
      type="number"
      @change="updateData({ delay: +$event })"
    />
  </edit-interaction-base>
</template>
<script setup>
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const forms = [
  { id: 'text-field', name: 'Text field' },
  { id: 'select', name: 'Select' },
  { id: 'checkbox', name: 'Checkbox' },
  { id: 'radio', name: 'Radio' },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
