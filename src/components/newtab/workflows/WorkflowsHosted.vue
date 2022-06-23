<template>
  <shared-card
    v-for="workflow in workflows"
    :key="workflow.hostId"
    :data="workflow"
    :menu="menu"
    @execute="executeWorkflow(workflow)"
    @click="$router.push(`/workflows/${$event.hostId}/host`)"
    @menuSelected="deleteWorkflow(workflow)"
  />
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkflowStore } from '@/stores/workflow';
import { useDialog } from '@/composable/dialog';
import { arraySorter } from '@/utils/helper';
import { cleanWorkflowTriggers } from '@/utils/workflowTrigger';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

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

const { t } = useI18n();
const dialog = useDialog();
const workflowStore = useWorkflowStore();

const menu = [
  { id: 'delete', name: t('common.delete'), icon: 'riDeleteBin7Line' },
];

const workflows = computed(() => {
  const filtered = Object.values(workflowStore.hosted).filter(({ name }) =>
    name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  );

  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});

async function deleteWorkflow(workflow) {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: workflow.name }),
    onConfirm: async () => {
      try {
        delete workflowStore.hosted[workflow.hostId];
        await cleanWorkflowTriggers(workflow.hostId);
      } catch (error) {
        console.error(error);
      }
    },
  });
}
</script>
