<template>
  <edit-interaction-base v-model:data="state">
    <ui-select
      v-model="state.type"
      class="block w-full mt-4 mb-3"
      placeholder="Form type"
    >
      <option v-for="form in forms" :key="form.id" :value="form.id">
        {{ form.name }}
      </option>
    </ui-select>
    <ui-checkbox
      v-if="state.type === 'checkbox' || state.type === 'radio'"
      v-model="state.selected"
    >
      Selected
    </ui-checkbox>
    <template v-if="state.type === 'text-field' || state.type === 'select'">
      <ui-textarea v-model="state.value" placeholder="Value" class="w-full" />
      <ui-checkbox v-model="state.clearValue" class="mb-1 ml-1">
        Clear form value
      </ui-checkbox>
    </template>
    <ui-input
      v-if="state.type === 'text-field'"
      v-model="state.delay"
      label="Typing delay (millisecond)(0 to disable)"
      placeholder="Delay"
      class="w-full"
      min="0"
      type="number"
    />
  </edit-interaction-base>
</template>
<script setup>
import { ref, watch } from 'vue';
import { debounce } from '@/utils/helper';
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

const state = ref(props.data);

watch(
  state,
  debounce((value) => {
    emit('update:data', value);
  }, 250),
  { deep: true }
);
</script>
