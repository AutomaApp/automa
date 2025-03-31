<template>
  <div
    v-if="workflows.length === 0"
    class="md:flex items-center md:text-left text-center py-12"
  >
    <img src="@/assets/svg/alien.svg" class="w-96" />
    <div class="ml-4">
      <h1 class="mb-6 max-w-md text-2xl font-semibold">
        {{ t('message.empty') }}
      </h1>
    </div>
  </div>
  <div v-else class="workflows-container">
    <shared-card
      v-for="workflow in workflows"
      :key="workflow.id"
      :data="workflow"
      :show-details="false"
      @execute="RendererWorkflowService.executeWorkflow(workflow)"
      @click="$router.push(`/workflows/${$event.id}/shared`)"
    />
  </div>
</template>
<script setup>
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { arraySorter } from '@/utils/helper';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
  sort: {
    type: Object,
    default: () => ({
      by: '',
      order: '',
    }),
  },
});

const sharedWorkflowStore = useSharedWorkflowStore();

const workflows = computed(() => {
  const filtered = sharedWorkflowStore.toArray.filter(({ name }) =>
    name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  );

  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});
</script>
