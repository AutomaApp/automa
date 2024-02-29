<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.type"
      label="Action"
      class="mt-4 w-full"
      @change="updateData({ type: $event })"
    >
      <optgroup v-for="action in actions" :key="action.id" :label="action.name">
        <option
          v-for="item in actionsItems[action.id]"
          :key="item.id"
          :value="item.id"
        >
          {{ item.name }}
        </option>
      </optgroup>
    </ui-select>
    <ui-checkbox
      v-if="includeExceptions.includes(data.type)"
      :model-value="data.exceptCurrent"
      class="mt-2"
      @change="updateData({ exceptCurrent: $event })"
    >
      Execpt for the current workflow
    </ui-checkbox>
    <!-- 停止当前工作流 是否抛出错误及自定义错误信息 -->
    <template v-if="data.type === 'stop-current'">
      <ui-checkbox
        :model-value="data.throwError"
        block
        class="block-variable mt-4"
        @change="updateData({ throwError: $event })"
      >
        {{ t(`workflow.blocks.workflow-state.error.throwError`) }}
      </ui-checkbox>
      <ui-input
        v-if="data.throwError"
        :model-value="data.errorMessage"
        :placeholder="t(`workflow.blocks.workflow-state.error.message`)"
        :title="t(`workflow.blocks.workflow-state.error.message`)"
        class="mt-2 w-full"
        @change="updateData({ errorMessage: $event })"
      />
    </template>
    <div
      v-if="data.type === 'stop-specific'"
      class="bg-input focus-within:bg-box-transparent-2 mt-4 rounded-lg transition"
    >
      <div
        v-if="data.workflowsToStop.length > 0"
        class="scroll overflow-auto px-4 py-2"
        style="max-height: 114px"
      >
        <div
          v-for="item in data.workflowsToStop"
          :key="item"
          class="bg-box-transparent mb-1 mr-1 inline-flex items-center rounded-md p-1 text-sm"
        >
          <span class="flex-1">
            {{ selectedWorkflows[item] }}
          </span>
          <v-remixicon
            name="riCloseLine"
            class="cursor-pointer text-gray-600 dark:text-gray-300"
            size="20"
            @click="removeSelectedItem(item)"
          />
        </div>
      </div>
      <ui-autocomplete
        :model-value="query"
        :items="workflows"
        item-key="id"
        item-label="name"
        block
        @selected="onItemSelected"
      >
        <input
          v-model="query"
          type="text"
          placeholder="Select a workflow"
          class="w-full rounded-lg bg-transparent py-2 px-4"
        />
      </ui-autocomplete>
    </div>
  </div>
</template>
<script setup>
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();

const includeExceptions = ['stop-all'];
const actions = [
  { id: 'stop', name: t('workflow.blocks.workflow-state.actions.stop') },
];
const actionsItems = {
  stop: [
    { id: 'stop-all', name: 'Stop all workflows' },
    { id: 'stop-current', name: 'Stop current workflow' },
    { id: 'stop-specific', name: 'Stop specific workflows' },
  ],
};

const query = ref('');
const selectedWorkflows = ref({});
const currentWorkflow = inject('workflow', {});

const workflows = computed(() => {
  let workflowsList = [];
  const workflow = currentWorkflow.data.value;

  if (workflow.id.startsWith('team')) {
    workflowsList = teamWorkflowStore.getByTeam(workflow.teamId) || [];
  } else {
    workflowsList = workflowStore.getWorkflows;
  }

  return workflowsList.filter((item) => {
    const selected = props.data.workflowsToStop.includes(item.id);
    if (selected) selectedWorkflows.value[item.id] = item.name;

    return !selected;
  });
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function onItemSelected({ item }) {
  const copy = [...props.data.workflowsToStop];
  copy.push(item.id);

  selectedWorkflows.value[item.id] = item.name;

  updateData({ workflowsToStop: copy });

  query.value = '';
}
function removeSelectedItem(itemId) {
  const copy = [...props.data.workflowsToStop];
  const index = props.data.workflowsToStop.indexOf(itemId);
  copy.splice(index, 1);

  updateData({ workflowsToStop: copy });

  delete selectedWorkflows.value[itemId];
}
</script>
