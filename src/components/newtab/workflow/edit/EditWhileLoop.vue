<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full mb-1"
      @change="updateData({ description: $event })"
    />
    <ui-button
      variant="accent"
      class="w-full mt-4"
      @click="showConditionBuilder = true"
    >
      {{ t('workflow.blocks.while-loop.editCondition') }}
    </ui-button>
    <ui-modal v-model="showConditionBuilder" custom-content>
      <ui-card padding="p-0" class="w-full max-w-3xl">
        <div class="px-4 pt-4 flex items-center">
          <p class="flex-1">
            {{ t('workflow.conditionBuilder.title') }}
          </p>
          <v-remixicon
            name="riCloseLine"
            class="cursor-pointer"
            @click="showConditionBuilder = false"
          />
        </div>
        <shared-condition-builder
          :model-value="data.conditions"
          class="overflow-auto p-4 mt-4 scroll"
          style="height: calc(100vh - 8rem)"
          @change="updateData({ conditions: $event })"
        />
      </ui-card>
    </ui-modal>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import SharedConditionBuilder from '@/components/newtab/shared/SharedConditionBuilder/index.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const defaultConditions = () => [
  {
    id: nanoid(),
    conditions: [
      {
        id: nanoid(),
        items: [
          {
            id: nanoid(),
            type: 'value',
            category: 'value',
            data: { value: '' },
          },
          { id: nanoid(), category: 'compare', type: 'eq' },
          {
            id: nanoid(),
            type: 'value',
            category: 'value',
            data: { value: '' },
          },
        ],
      },
      {
        id: nanoid(),
        items: [
          {
            id: nanoid(),
            type: 'value',
            category: 'value',
            data: { value: '' },
          },
          { id: nanoid(), category: 'compare', type: 'eq' },
          {
            id: nanoid(),
            type: 'value',
            category: 'value',
            data: { value: '' },
          },
        ],
      },
    ],
  },
];

const showConditionBuilder = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

onMounted(() => {
  if (props.data.conditions === null) {
    updateData({ conditions: defaultConditions() });
  }
});
</script>
