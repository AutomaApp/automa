<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-input
      :model-value="data.regex"
      placeholder="Regex"
      class="mt-2 w-full"
      @change="updateData"
    />
    <ui-input
      :model-value="data.dataColumn"
      list="data-columns"
      placeholder="Data column"
      class="mt-3 w-full"
      @blur="updateDataColumn"
    ></ui-input>
    <datalist id="data-columns">
      <option
        v-for="column in workflow.data.dataColumns"
        :key="column"
        :value="column"
      />
    </datalist>
  </edit-interaction-base>
</template>
<script setup>
import { inject } from 'vue';
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const workflow = inject('workflow');

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateDataColumn({ target: { value } }) {
  if (!value.trim()) return;

  console.log(value, workflow.data);
}
</script>
