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
    <ui-tab-panel value="new" class="px-4 mt-3">
      <form @submit.prevent="$emit('record', { name: state.workflowName })">
        <ui-input
          v-model="state.workflowName"
          :label="t('home.record.name')"
          :placeholder="t('common.name')"
          autofocus
          class="w-full"
        />
        <ui-button class="w-full mt-6" variant="accent" type="submit">
          {{ t('home.record.button') }}
        </ui-button>
      </form>
    </ui-tab-panel>
    <ui-tab-panel cache value="existing">
      <home-select-block
        v-if="activeWorkflow"
        :workflow="activeWorkflow"
        @record="$emit('record', $event)"
        @goBack="state.activeWorkflow = ''"
      />
      <template v-else>
        <div class="px-4 mt-4">
          <ui-input
            v-model="state.query"
            class="w-full"
            prepend-icon="riSearch2Line"
            :placeholder="t('common.search')"
          />
        </div>
        <ui-list class="overflow-y-auto scroll px-4 mt-2 mb-4 h-72">
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
            <span v-else class="p-2 rounded-lg bg-box-transparent">
              <v-remixicon :name="workflow.icon" size="20" />
            </span>
            <div class="ml-2 overflow-hidden flex-1">
              <p :title="workflow.name" class="text-overflow leading-tight">
                {{ workflow.name }}
              </p>
              <p
                :title="workflow.description"
                class="text-overflow text-gray-600 leading-tight text-sm"
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
import Workflow from '@/models/workflow';
import HomeSelectBlock from './HomeSelectBlock.vue';

const emit = defineEmits(['update', 'close', 'record']);

emit('update', 'new');

const tabs = ['new', 'existing'];
const { t } = useI18n();

const state = reactive({
  query: '',
  workflowName: '',
  activeTab: 'new',
  activeWorkflow: '',
});

const activeWorkflow = computed(() => Workflow.find(state.activeWorkflow));
const workflows = computed(() =>
  Workflow.query()
    .where(({ name }) =>
      name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
    )
    .orderBy('createdAt', 'desc')
    .get()
);
</script>
