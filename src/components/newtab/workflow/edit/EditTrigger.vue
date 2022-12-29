<template>
  <div class="trigger">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-button
      variant="accent"
      class="w-full mt-4"
      @click="state.showTriggersModal = true"
    >
      Edit Triggers
    </ui-button>
    <ui-button class="mt-4" @click="state.showParamModal = true">
      <v-remixicon name="riCommandLine" class="mr-2 -ml-1" />
      <span>Parameters</span>
    </ui-button>
    <ui-modal
      v-model="state.showParamModal"
      title="Parameters"
      content-class="max-w-4xl"
    >
      <edit-workflow-parameters
        :prefer-tab="data.preferParamsInTab"
        :data="data.parameters"
        @update="updateData({ parameters: $event })"
        @update:prefer-tab="updateData({ preferParamsInTab: $event })"
      />
    </ui-modal>
    <ui-modal
      v-model="state.showTriggersModal"
      title="Workflow Triggers"
      content-class="max-w-2xl"
    >
      <shared-workflow-triggers
        :triggers="state.triggers"
        @update="updateWorkflow"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid/non-secure';
import SharedWorkflowTriggers from '@/components/newtab/shared/SharedWorkflowTriggers.vue';
import EditWorkflowParameters from './EditWorkflowParameters.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const state = reactive({
  showParamModal: false,
  showTriggersModal: false,
  triggers: [...(props.data?.triggers || [])],
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateWorkflow(triggers) {
  state.triggers = triggers;
  updateData({ triggers });
}

onMounted(() => {
  if (props.data.triggers) return;

  state.triggers = [
    { type: props.data.type, data: { ...props.data }, id: nanoid(5) },
  ];
});
</script>
<style>
.trigger-item > button {
  @apply focus:ring-0;
  text-align: left;
  .delete-btn {
    visibility: hidden;
  }
  &:hover .delete-btn {
    visibility: visible;
  }
}
</style>
