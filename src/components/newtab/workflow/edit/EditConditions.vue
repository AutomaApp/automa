<template>
  <div>
    <ui-button variant="accent" class="mb-4" @click="addCondition">
      Add condition
    </ui-button>
    <ul class="space-y-2">
      <li
        v-for="(condition, index) in conditions"
        :key="index"
        class="relative rounded-lg bg-input transition-colors group"
      >
        <input
          v-model="condition.compareValue"
          type="text"
          placeholder="value"
          class="py-2 px-4 w-full transition rounded-lg bg-transparent"
        />
        <button
          class="
            bg-white
            absolute
            top-1/2
            right-4
            p-2
            rounded-lg
            -translate-y-1/2
            group-hover:right-14
          "
          @click="deleteCondition(index)"
        >
          <v-remixicon size="20" name="riDeleteBin7Line" />
        </button>
        <select
          v-model="condition.type"
          :title="getTitle(index)"
          class="
            bg-white
            absolute
            right-4
            font-mono
            z-10
            p-2
            top-1/2
            leading-tight
            -translate-y-1/2
            text-center
            transition
            rounded-lg
            appearance-none
          "
        >
          <option
            v-for="(name, type) in conditionTypes"
            :key="type"
            :value="type"
          >
            {{ type }}
          </option>
        </select>
        <div
          class="w-full bg-gray-300 h-px mx-auto"
          style="max-width: 89%"
        ></div>
        <input
          v-model="condition.value"
          type="text"
          placeholder="value"
          class="py-2 px-4 w-full transition rounded-lg bg-transparent"
        />
      </li>
    </ul>
  </div>
</template>
<script setup>
import { toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import emitter from 'tiny-emitter/instance';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  blockId: {
    type: String,
    default: '',
  },
});
defineEmits(['update:data']);

const conditionTypes = {
  '==': 'equals',
  '!=': 'ne',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
  '()': 'contains',
};
const { t } = useI18n();

const conditions = toRef(props.data, 'conditions');

function getTitle(index) {
  const type = conditionTypes[conditions.value[index]?.type] || 'equals';

  return t(`workflow.blocks.conditions.${type}`);
}
function addCondition() {
  if (conditions.value.length >= 10) return;

  conditions.value.unshift({
    compareValue: '',
    value: '',
    type: '==',
  });

  emitter.emit('conditions-block:add', {
    id: props.blockId,
  });
}
function deleteCondition(index) {
  conditions.value.splice(index, 1);

  emitter.emit('conditions-block:delete', {
    index,
    id: prps.blockId,
  });
}
// function updateData(value) {
//   emit('update:data', { ...props.data, ...value });
// }
</script>
