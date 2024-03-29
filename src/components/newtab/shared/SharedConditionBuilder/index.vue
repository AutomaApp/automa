<template>
  <div class="space-y-4">
    <ui-button v-if="conditions.length === 0" @click="addOrCondition">
      {{ t('workflow.conditionBuilder.add') }}
    </ui-button>
    <div v-for="(item, index) in conditions" :key="item.id">
      <div class="condition-group relative flex">
        <div
          v-show="item.conditions.length > 1"
          class="and-text relative mr-4 mb-12 flex items-center"
          :class="{ 'add-line': item.conditions.length > 1 }"
        >
          <span
            class="relative z-10 inline-block w-14 rounded-md bg-blue-500 py-1 text-center text-white dark:bg-blue-300 dark:text-black"
          >
            {{ t('workflow.conditionBuilder.and') }}
          </span>
        </div>
        <div class="flex-1 space-y-2">
          <draggable
            v-model="conditions[index].conditions"
            item-key="id"
            handle=".handle"
            group="conditions"
            class="space-y-2"
            @end="onDragEnd"
          >
            <template #item="{ element: inputs, index: inputsIndex }">
              <div class="condition-item">
                <ui-expand
                  class="w-full rounded-lg border"
                  header-class="px-4 py-2 w-full flex items-center h-full rounded-lg overflow-hidden group focus:ring-0"
                >
                  <template #header>
                    <p class="text-overflow w-64 flex-1 space-x-2 text-left">
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
                      class="invisible ml-4 group-hover:visible"
                      @click.stop="deleteCondition(index, inputsIndex)"
                    />
                    <v-remixicon
                      name="mdiDrag"
                      class="handle ml-2 cursor-move"
                    />
                  </template>
                  <div class="space-y-2 px-4 py-2">
                    <condition-builder-inputs
                      :autocomplete="autocomplete"
                      :data="inputs.items"
                      @update="
                        conditions[index].conditions[inputsIndex].items = $event
                      "
                    />
                  </div>
                </ui-expand>
              </div>
            </template>
          </draggable>
          <div class="condition-action mt-2 space-x-2 text-sm">
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
        class="or-text relative mt-4 text-left"
      >
        <span
          class="line absolute top-1/2 left-0 w-full -translate-y-1/2 bg-indigo-500 dark:bg-indigo-400"
          style="height: 2px"
        ></span>
        <span
          class="relative z-10 inline-block w-14 rounded-md bg-indigo-500 py-1 text-center text-white dark:bg-indigo-300 dark:text-black"
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
import Draggable from 'vuedraggable';
import cloneDeep from 'lodash.clonedeep';
import { conditionBuilder } from '@/utils/shared';
import ConditionBuilderInputs from './ConditionBuilderInputs.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  autocomplete: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:modelValue', 'change']);

const { t } = useI18n();

const conditions = ref(cloneDeep(props.modelValue));

function getDefaultValues(items = ['value', 'compare', 'value']) {
  const defaultValues = {
    value: {
      type: 'value',
      category: 'value',
      data: { value: '' },
    },
    compare: { category: 'compare', type: 'eq' },
  };
  const selectValue = (type) =>
    cloneDeep({
      ...defaultValues[type],
      id: nanoid(),
    });

  if (typeof items === 'string') {
    return selectValue(items);
  }

  return items.map((item) => selectValue(item));
}
function getConditionText({ category, type, data }) {
  if (category === 'compare') {
    return conditionBuilder.compareTypes.find(({ id }) => id === type).name;
  }

  let text = '';

  if (type === 'value') {
    text = data.value || 'Empty';
  } else if (type.startsWith('code')) {
    text = 'JS Code';
  } else if (type.startsWith('element')) {
    text = type;

    const textDetail = data.attrName || data.selector;

    if (textDetail) text += `(${textDetail})`;
  } else if (type.startsWith('data')) {
    text = `Data exists (${data.dataPath})`;
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
function onDragEnd() {
  conditions.value.forEach((item, index) => {
    if (item.conditions.length > 0) return;

    conditions.value.splice(index, 1);
  });
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
.ghost-condition .condition-action {
  display: none;
}
</style>
