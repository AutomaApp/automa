<template>
  <div class="space-y-4">
    <ui-button v-if="conditions.length === 0" @click="addOrCondition">
      {{ t('workflow.conditionBuilder.add') }}
    </ui-button>
    <div v-for="(item, index) in conditions" :key="item.id">
      <div class="flex relative condition-group">
        <div
          v-show="item.conditions.length > 1"
          class="and-text mr-4 relative mb-12 flex items-center"
          :class="{ 'add-line': item.conditions.length > 1 }"
        >
          <span
            class="py-1 w-14 text-center text-white dark:text-black rounded-md dark:bg-blue-300 bg-blue-500 inline-block z-10 relative"
          >
            {{ t('workflow.conditionBuilder.and') }}
          </span>
        </div>
        <div class="flex-1 space-y-2">
          <ui-expand
            v-for="(inputs, inputsIndex) in item.conditions"
            :key="inputs.id"
            class="border rounded-lg w-full"
            header-class="px-4 py-2 w-full flex items-center h-full rounded-lg overflow-hidden group focus:ring-0"
          >
            <template #header>
              <p class="text-overflow flex-1 text-left space-x-2 w-64">
                <span
                  v-for="input in inputs.items"
                  :key="`text-${input.id}`"
                  :class="[
                    input.category === 'compare'
                      ? 'font-semibold'
                      : 'text-gray-600 dark:text-gray-200',
                  ]"
                >
                  {{ getConditionText(input) }}
                </span>
              </p>
              <v-remixicon
                name="riDeleteBin7Line"
                class="ml-4 group-hover:visible invisible"
                @click.stop="deleteCondition(index, inputsIndex)"
              />
            </template>
            <div class="space-y-2 px-4 py-2">
              <condition-builder-inputs
                :data="inputs.items"
                @update="
                  conditions[index].conditions[inputsIndex].items = $event
                "
              />
            </div>
          </ui-expand>
          <div class="space-x-2 text-sm">
            <ui-button @click="addAndCondition(index)">
              <v-remixicon name="riAddLine" class="-ml-2 mr-1" size="20" />
              {{ t('workflow.conditionBuilder.and') }}
            </ui-button>
            <ui-button
              v-if="index === conditions.length - 1"
              @click="addOrCondition"
            >
              <v-remixicon name="riAddLine" class="-ml-2 mr-1" size="20" />
              {{ t('workflow.conditionBuilder.or') }}
            </ui-button>
          </div>
        </div>
      </div>
      <div
        v-show="index !== conditions.length - 1"
        class="text-left or-text relative mt-4"
      >
        <span
          class="line bg-indigo-500 dark:bg-indigo-400 w-full absolute top-1/2 -translate-y-1/2 left-0"
          style="height: 2px"
        ></span>
        <span
          class="py-1 dark:text-black rounded-md dark:bg-indigo-300 bg-indigo-500 w-14 relative z-10 inline-block text-white text-center"
        >
          {{ t('workflow.conditionBuilder.or') }}
        </span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import { conditionBuilder } from '@/utils/shared';
import ConditionBuilderInputs from './ConditionBuilderInputs.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:modelValue', 'change']);

const { t } = useI18n();

const conditions = ref(JSON.parse(JSON.stringify(props.modelValue)));

function getDefaultValues(items = ['value', 'compare', 'value']) {
  const defaultValues = {
    value: {
      id: nanoid(),
      type: 'value',
      category: 'value',
      data: { value: '' },
    },
    compare: { id: nanoid(), category: 'compare', type: 'eq' },
  };

  if (typeof items === 'string') return defaultValues[items];

  return items.map((item) => defaultValues[item]);
}
function getConditionText({ category, type, data }) {
  if (category === 'compare') {
    return conditionBuilder.compareTypes.find(({ id }) => id === type).name;
  }

  let text = '';

  if (type === 'value') {
    text = data.value || 'Empty';
  } else if (type.startsWith('element')) {
    text = type;

    const textDetail = data.attrName || data.selector;

    if (textDetail) text += `(${textDetail})`;
  }

  return text;
}
function addOrCondition() {
  const newOrCondition = getDefaultValues();

  conditions.value.push({
    id: nanoid(),
    conditions: [{ id: nanoid(), items: newOrCondition }],
  });
}
function addAndCondition(index) {
  const newAndCondition = getDefaultValues();

  conditions.value[index].conditions.push({
    id: nanoid(),
    items: newAndCondition,
  });
}
function deleteCondition(index, itemIndex) {
  const condition = conditions.value[index].conditions;

  condition.splice(itemIndex, 1);

  if (condition.length === 0) conditions.value.splice(index, 1);
}

watch(
  conditions,
  (value) => {
    emit('change', value);
    emit('update:modelValue', value);
  },
  { deep: true }
);
</script>
<style scoped>
.and-text.add-line:before {
  content: '';
  position: absolute;
  top: 0;
  width: 30px;
  height: 100%;
  left: 50%;
  @apply dark:border-blue-400 border-blue-500 border-2 border-r-0 rounded-bl-lg rounded-tl-lg;
}
</style>
