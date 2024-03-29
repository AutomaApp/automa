<template>
  <ui-tabs
    v-model="state.activeTab"
    fill
    class="mx-4"
    @change="$emit('update', $event)"
  >
    <ui-tab v-for="tab in tabs" :key="tab" :value="tab">
      {{ t(`home.record.tabs.${tab}`) }}
    </ui-tab>
  </ui-tabs>
  <ui-tab-panels :model-value="state.activeTab">
    <ui-tab-panel value="new" class="mt-3 px-4">
      <form @submit.prevent="$emit('record', { name: state.workflowName })">
        <ui-input
          v-model="state.workflowName"
          :label="t('home.record.name')"
          :placeholder="t('common.name')"
          autofocus
          class="w-full"
        />
        <ui-button class="mt-6 w-full" variant="accent" type="submit">
          {{ t('home.record.button') }}
        </ui-button>
      </form>
    </ui-tab-panel>
    <ui-tab-panel cache value="existing">
      <home-select-block
        v-if="activeWorkflow"
        :workflow="activeWorkflow"
        @update="updateWorkflow"
        @record="$emit('record', $event)"
        @goBack="state.activeWorkflow = ''"
      />
      <template v-else>
        <div class="mt-4 px-4">
          <ui-input
            v-model="state.query"
            class="w-full"
            prepend-icon="riSearch2Line"
            :placeholder="t('common.search')"
          />
        </div>
        <ui-list class="scroll mt-2 mb-4 h-72 overflow-y-auto px-4">
          <ui-list-item
            v-for="workflow in workflows"
            :key="workflow.id"
            small
            class="cursor-pointer"
            @click="state.activeWorkflow = workflow.id"
          >
            <img
              v-if="workflow.icon?.startsWith('http')"
              :src="workflow.icon"
              class="overflow-hidden rounded-lg"
              style="height: 32px; width: 32px"
              alt="Can not display"
            />
            <span v-else class="bg-box-transparent rounded-lg p-2">
              <v-remixicon :name="workflow.icon" size="20" />
            </span>
            <div class="ml-2 flex-1 overflow-hidden">
              <p :title="workflow.name" class="text-overflow leading-tight">
                {{ workflow.name }}
              </p>
              <p
                :title="workflow.description"
                class="text-overflow text-sm leading-tight text-gray-600"
              >
                {{ workflow.description }}
              </p>
            </div>
          </ui-list-item>
        </ui-list>
      </template>
    </ui-tab-panel>
  </ui-tab-panels>
</template>
<script setup>
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkflowStore } from '@/stores/workflow';
import HomeSelectBlock from './HomeSelectBlock.vue';

const emit = defineEmits(['update', 'close', 'record']);

emit('update', 'new');

const tabs = ['new', 'existing'];

const { t } = useI18n();
const workflowStore = useWorkflowStore();

const state = reactive({
  query: '',
  workflowName: '',
  activeTab: 'new',
  activeWorkflow: '',
});

const activeWorkflow = computed(() =>
  workflowStore.getById(state.activeWorkflow)
);
const workflows = computed(() =>
  workflowStore.getWorkflows
    .filter(({ name }) =>
      name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
    )
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
);

function updateWorkflow(data) {
  workflowStore.update({
    data,
    id: state.activeWorkflow,
  });
}
</script>
