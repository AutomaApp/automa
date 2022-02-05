<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <hr />
    <div class="flex rounded-lg bg-input px-4 items-center transition">
      <span>/</span>
      <input
        :value="data.regex"
        placeholder="Regex"
        class="w-11/12 bg-transparent p-2 focus:ring-0"
        @change="updateData({ regex: $event.target.value })"
      />
      <ui-popover>
        <template #trigger>
          <button>/{{ regexExp.join('') }}</button>
        </template>
        <p class="mb-2 text-gray-600 dark:text-gray-200">Expression flags</p>
        <div class="space-y-1">
          <div v-for="item in exps" :key="item.id">
            <ui-checkbox
              :model-value="regexExp.includes(item.id)"
              @change="handleExpCheckbox(item.id, $event)"
            >
              {{ item.name }}
            </ui-checkbox>
          </div>
        </div>
      </ui-popover>
    </div>
    <div class="mt-2 flex space-x-2">
      <ui-input
        :model-value="data.prefixText"
        :title="t('workflow.blocks.get-text.prefixText.title')"
        :label="t('workflow.blocks.get-text.prefixText.placeholder')"
        placeholder="Text"
        class="w-full"
        @change="updateData({ prefixText: $event })"
      />
      <ui-input
        :model-value="data.suffixText"
        :title="t('workflow.blocks.get-text.suffixText.title')"
        :label="t('workflow.blocks.get-text.suffixText.placeholder')"
        placeholder="Text"
        class="w-full"
        @change="updateData({ suffixText: $event })"
      />
    </div>
    <ui-checkbox
      :model-value="data.includeTags"
      class="mt-4"
      @change="updateData({ includeTags: $event })"
    >
      {{ t('workflow.blocks.get-text.includeTags') }}
    </ui-checkbox>
    <hr />
    <ui-checkbox
      :model-value="data.assignVariable"
      block
      @change="updateData({ assignVariable: $event })"
    >
      {{ t('workflow.variables.assign') }}
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      :placeholder="t('workflow.variables.name')"
      :title="t('workflow.variables.name')"
      class="mt-2 w-full"
      @change="updateData({ variableName: $event })"
    />
    <ui-checkbox
      :model-value="data.saveData"
      block
      class="mt-4"
      @change="updateData({ saveData: $event })"
    >
      {{ t('workflow.blocks.get-text.checkbox') }}
    </ui-checkbox>
    <div v-if="data.saveData" class="flex items-center mt-2 mb-4">
      <ui-select
        :model-value="data.dataColumn"
        placeholder="Select column"
        class="mr-2 flex-1"
        @change="updateData({ dataColumn: $event })"
      >
        <option
          v-for="column in workflow.data.value.table"
          :key="column.name"
          :value="column.name"
        >
          {{ column.name }}
        </option>
      </ui-select>
    </div>
    <ui-checkbox
      :model-value="data.addExtraRow"
      block
      class="mt-4"
      @change="updateData({ addExtraRow: $event })"
    >
      {{ t('workflow.blocks.get-text.extraRow.checkbox') }}
    </ui-checkbox>
    <template v-if="data.addExtraRow">
      <ui-input
        :model-value="data.extraRowValue"
        :title="t('workflow.blocks.get-text.extraRow.title')"
        :placeholder="t('workflow.blocks.get-text.extraRow.placeholder')"
        class="w-full my-2"
        @change="updateData({ extraRowValue: $event })"
      />
      <ui-select
        :model-value="data.extraRowDataColumn"
        placeholder="Select column"
        class="w-full"
        @change="updateData({ extraRowDataColumn: $event })"
      >
        <option
          v-for="column in workflow.data.value.table"
          :key="column.name"
          :value="column.name"
        >
          {{ column.name }}
        </option>
      </ui-select>
    </template>
  </edit-interaction-base>
</template>
<script setup>
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const workflow = inject('workflow');
const regexExp = ref([...new Set(props.data.regexExp)]);

const exps = [
  { id: 'g', name: 'global' },
  { id: 'i', name: 'ignore case' },
  { id: 'm', name: 'multiline' },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function handleExpCheckbox(id, value) {
  if (value) {
    regexExp.value.push(id);
  } else {
    regexExp.value.splice(regexExp.value.indexOf(id), 1);
  }

  updateData({ regexExp: regexExp.value });
}
</script>
