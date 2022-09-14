<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <div class="my-4 flex items-center space-x-2">
      <p v-if="state.showSettings" class="font-semibold">
        {{ t('common.settings') }}
      </p>
      <ui-button
        v-else
        :disabled="conditions.length >= 20"
        variant="accent"
        class="mr-2"
        @click="addCondition"
      >
        {{ t('workflow.blocks.conditions.add') }}
      </ui-button>
      <div class="flex-grow"></div>
      <edit-block-settings
        :data="{ data, blockId }"
        on-error-label="Cn conditions not met"
        @change="updateData($event)"
      >
        <template #button="{ show }">
          <ui-button v-tooltip:bottom="t('common.settings')" icon @click="show">
            <v-remixicon
              :name="state.showSettings ? 'riCloseLine' : 'riSettings3Line'"
            />
          </ui-button>
        </template>
        <template #on-error>
          <label class="flex items-center mt-6">
            <ui-switch
              :model-value="data.retryConditions"
              @change="updateData({ retryConditions: $event })"
            />
            <span class="ml-2 leading-tight">
              {{ t('workflow.blocks.conditions.retryConditions') }}
            </span>
          </label>
          <div v-if="data.retryConditions" class="mt-2">
            <ui-input
              :model-value="data.retryCount"
              :title="t('workflow.blocks.element-exists.tryFor.title')"
              :label="t('workflow.blocks.element-exists.tryFor.label')"
              class="w-full mb-1"
              type="number"
              min="1"
              @change="updateData({ retryCount: +$event })"
            />
            <ui-input
              :model-value="data.retryTimeout"
              :label="t('workflow.blocks.element-exists.timeout.label')"
              :title="t('workflow.blocks.element-exists.timeout.title')"
              class="w-full"
              type="number"
              min="200"
              @change="updateData({ retryTimeout: +$event })"
            />
          </div>
        </template>
      </edit-block-settings>
    </div>
    <draggable
      v-model="conditions"
      item-key="id"
      tag="ui-list"
      class="space-y-1"
      @end="onEnd"
    >
      <template #item="{ element, index }">
        <ui-list-item class="group cursor-move">
          <v-remixicon name="riGuideLine" size="20" class="mr-2 -ml-1" />
          <p class="flex-1 text-overflow" :title="element.name">
            {{ element.name }}
          </p>
          <v-remixicon
            class="cursor-pointer group-hover:visible invisible"
            name="riPencilLine"
            size="20"
            @click="editCondition(index)"
          />
          <v-remixicon
            name="riDeleteBin7Line"
            size="20"
            class="ml-2 -mr-1 cursor-pointer"
            @click="deleteCondition(index, element.id)"
          />
        </ui-list-item>
      </template>
    </draggable>
    <ui-modal v-model="state.showModal" custom-content>
      <ui-card padding="p-0" class="w-full max-w-3xl">
        <div class="px-4 pt-4 flex items-center">
          <p class="flex-1">
            {{ t('workflow.conditionBuilder.title') }}
          </p>
          <v-remixicon
            name="riCloseLine"
            class="cursor-pointer"
            @click="state.showModal = false"
          />
        </div>
        <div
          class="overflow-auto p-4 scroll"
          style="height: calc(100vh - 8rem)"
        >
          <input
            v-model="conditions[state.conditionsIndex].name"
            class="text-xl font-semibold mb-4 bg-transparent focus:ring-0"
          />
          <shared-condition-builder
            :model-value="conditions[state.conditionsIndex].conditions"
            @change="conditions[state.conditionsIndex].conditions = $event"
          />
        </div>
      </ui-card>
    </ui-modal>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import Draggable from 'vuedraggable';
import { sleep } from '@/utils/helper';
import SharedConditionBuilder from '@/components/newtab/shared/SharedConditionBuilder/index.vue';
import EditBlockSettings from './EditBlockSettings.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
  fullData: {
    type: Object,
    default: () => ({}),
  },
  blockId: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:data']);

const conditionTypes = {
  '==': 'eq',
  '!=': 'nq',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
  '()': 'cnt',
};
const { t } = useI18n();

const conditions = ref(props.data.conditions);
const state = shallowReactive({
  showModal: false,
  conditionsIndex: 0,
  showSettings: false,
});

function editCondition(index) {
  state.conditionsIndex = index;
  state.showModal = true;
}
function addCondition() {
  if (conditions.value.length >= 20) return;

  conditions.value.push({
    id: nanoid(),
    name: `Path ${conditions.value.length + 1}`,
    conditions: [],
  });
}
function deleteCondition(index, id) {
  conditions.value.splice(index, 1);

  props.editor.removeEdges((edges) => {
    return edges.filter(
      (edge) => edge.sourceHandle === `${props.blockId}-output-${id}`
    );
  });
}
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
async function onEnd() {
  props.editor.addSelectedNodes([]);
  await sleep(1000);
  props.editor.addSelectedNodes([props.editor.getNode.value(props.blockId)]);
}

watch(
  conditions,
  () => {
    updateData({ conditions: conditions.value });
  },
  { deep: true }
);

onMounted(() => {
  if (props.fullData?.editCondition) {
    const index = props.data.conditions.findIndex(
      (item) => item.id === props.fullData.editCondition
    );
    if (index !== -1) editCondition(index);
  }

  const condition = props.data.conditions[0];
  if (condition && condition.conditions) return;

  const generateConditionItem = (type, data) => {
    if (type === 'value') {
      return {
        id: nanoid(),
        type: 'value',
        category: 'value',
        data: { value: data },
      };
    }

    return { id: nanoid(), category: 'compare', type: data };
  };
  conditions.value = conditions.value.map((item, index) => {
    const items = [
      generateConditionItem('value', item.compareValue),
      generateConditionItem('compare', conditionTypes[item.type]),
      generateConditionItem('value', item.value),
    ];

    return {
      id: nanoid(),
      name: `Path ${index + 1}`,
      conditions: [
        {
          id: nanoid(),
          conditions: [{ id: nanoid(), items }],
        },
      ],
    };
  });
});
</script>
