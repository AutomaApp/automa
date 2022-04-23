<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <hr />
    <div class="flex rounded-lg bg-input px-4 items-center transition">
      <span>/</span>
      <input
        :value="data.regex"
        placeholder="Regex"
        class="w-11/12 bg-transparent p-2 focus:ring-0"
        @input="updateData({ regex: $event.target.value })"
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
      <edit-autocomplete class="w-full">
        <ui-input
          :model-value="data.prefixText"
          :title="t('workflow.blocks.get-text.prefixText.title')"
          :label="t('workflow.blocks.get-text.prefixText.placeholder')"
          autocomplete="off"
          placeholder="Text"
          class="w-full"
          @change="updateData({ prefixText: $event })"
        />
      </edit-autocomplete>
      <edit-autocomplete class="w-full">
        <ui-input
          :model-value="data.suffixText"
          :title="t('workflow.blocks.get-text.suffixText.title')"
          :label="t('workflow.blocks.get-text.suffixText.placeholder')"
          autocomplete="off"
          placeholder="Text"
          class="w-full"
          @change="updateData({ suffixText: $event })"
        />
      </edit-autocomplete>
    </div>
    <ui-checkbox
      :model-value="data.includeTags"
      class="mt-4"
      @change="updateData({ includeTags: $event })"
    >
      {{ t('workflow.blocks.get-text.includeTags') }}
    </ui-checkbox>
    <hr />
    <insert-workflow-data
      :data="data"
      variables
      extra-row
      @update="updateData"
    />
  </edit-interaction-base>
</template>
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import InsertWorkflowData from './InsertWorkflowData.vue';
import EditInteractionBase from './EditInteractionBase.vue';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

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
