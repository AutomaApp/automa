<template>
  <div class="overflow-auto scroll w-full content">
    <div v-if="!query && workflows.length === 0" class="text-center">
      <img src="@/assets/svg/files-and-folder.svg" class="mx-auto max-w-sm" />
      <p class="text-xl font-semibold">{{ t('message.noData') }}</p>
    </div>
    <ui-list class="space-y-1">
      <ui-list-item
        v-for="workflow in workflows"
        :key="workflow.id"
        :class="{ 'bg-box-transparent': isActive(workflow.id) }"
        class="overflow-hidden group"
      >
        <ui-checkbox
          v-if="!isLocal || !workflow.isInCloud"
          :disabled="exceedLimit && !isActive(workflow.id)"
          :model-value="isActive(workflow.id)"
          class="mr-4"
          @change="toggleDeleteWorkflow($event, workflow.id)"
        />
        <div v-else class="w-5 h-5 mr-4" />
        <ui-img
          v-if="workflow.icon?.startsWith('http')"
          :src="workflow.icon"
          style="height: 24px; width: 24px"
          alt="Can not display"
        />
        <v-remixicon v-else :name="workflow.icon" />
        <div class="flex-1 ml-2 overflow-hidden">
          <p class="text-overflow flex-1">{{ workflow.name }}</p>
          <p
            class="text-gray-600 text-sm dark:text-gray-200 leading-tight text-overflow"
          >
            {{ workflow.description }}
          </p>
        </div>
        <slot :workflow="workflow" />
      </ui-list-item>
    </ui-list>
  </div>
  <div class="flex items-center">
    <ui-checkbox
      :model-value="exceedLimit"
      :indeterminate="modelValue.length > 0 && modelValue.length < limit"
      class="mt-2 ml-4"
      @change="$emit('select', $event)"
    >
      {{
        t(
          `settings.backupWorkflows.cloud.${
            modelValue.length > 0 && modelValue.length >= limit
              ? 'deselectAll'
              : 'selectAll'
          }`
        )
      }}
    </ui-checkbox>
    <div class="flex-grow"></div>
    <span> {{ modelValue.length }}/{{ limit }} </span>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  workflows: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  limit: {
    type: Number,
    default: Infinity,
  },
  query: {
    type: String,
    default: '',
  },
  isLocal: Boolean,
});
const emit = defineEmits(['update:modelValue', 'select']);

const { t } = useI18n();

const exceedLimit = computed(() => props.modelValue.length >= props.limit);

function toggleDeleteWorkflow(selected, workflowId) {
  const workflows = [...props.modelValue];

  if (selected) {
    workflows.push(workflowId);
  } else {
    const index = workflows.indexOf(workflowId);

    if (index !== -1) workflows.splice(index, 1);
  }

  emit('update:modelValue', workflows);
}
function isActive(workflowId) {
  return props.modelValue.includes(workflowId);
}
</script>
