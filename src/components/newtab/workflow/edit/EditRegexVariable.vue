<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.variableName"
      :label="t('workflow.variables.name')"
      :title="t('workflow.variables.name')"
      class="mt-2 w-full"
      @change="updateData({ variableName: $event })"
    />
    <ui-select
      :model-value="data.method"
      label="Method"
      class="mt-2 w-full"
      @change="updateData({ method: $event })"
    >
      <option v-for="method in methods" :key="method.id" :value="method.id">
        {{ method.name }}
      </option>
    </ui-select>
    <ui-input
      :model-value="data.replaceVal"
      label="Replace with"
      placeholder="(empty)"
      class="mt-2 w-full"
      @change="updateData({ replaceVal: $event })"
    />
    <div class="flex items-end mt-3">
      <div class="flex-1 mr-2">
        <label
          class="ml-1 block text-gray-600 dark:text-gray-200 text-sm"
          for="var-expression"
        >
          RegEx
        </label>
        <div
          class="flex items-center bg-input transition-colors px-4 rounded-lg"
        >
          <span>/</span>
          <input
            id="var-expression"
            :value="data.expression"
            placeholder="Expression"
            class="py-2 w-11/12 bg-transparent focus:ring-0 px-1"
            @input="updateData({ expression: $event.target.value })"
          />
          <span class="text-right">/</span>
        </div>
      </div>
      <ui-popover>
        <template #trigger>
          <button class="p-2 rounded-lg bg-input" title="Flags">
            {{ data.flag.length === 0 ? 'flags' : data.flag.join('') }}
          </button>
        </template>
        <p>Flags</p>
        <ul class="mt-2 space-y-1">
          <li v-for="flag in flags" :key="flag.id">
            <ui-checkbox
              :model-value="data.flag.includes(flag.id)"
              @change="updateFlag($event, flag.id)"
            >
              {{ flag.name }}
            </ui-checkbox>
          </li>
        </ul>
      </ui-popover>
    </div>
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

const methods = [
  { id: 'match', name: 'Match value' },
  { id: 'replace', name: 'Replace value' },
];
const flags = [
  { id: 'g', name: 'global' },
  { id: 'i', name: 'ignore case' },
  { id: 'm', name: 'multiline' },
];

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateFlag(include, flag) {
  const copyFlag = [...props.data.flag];

  if (include) {
    copyFlag.push(flag);
  } else {
    const index = copyFlag.indexOf(flag);
    copyFlag.splice(index, 1);
  }

  updateData({ flag: copyFlag });
}
</script>
<style>
.log-data .block-variable {
  margin-top: 4px;
}
</style>
