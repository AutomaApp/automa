<template>
  <div class="mb-12">
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      autoresize
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.workflowId"
      :placeholder="t('workflow.blocks.execute-workflow.select')"
      class="w-full mb-2"
      @change="updateData({ workflowId: $event })"
    >
      <option
        v-for="workflow in workflows"
        :key="workflow.id"
        :value="workflow.id"
      >
        {{ workflow.name }}
      </option>
    </ui-select>
    <ui-input
      :model-value="data.executeId"
      :label="t('workflow.blocks.execute-workflow.executeId')"
      :title="t('workflow.blocks.execute-workflow.executeId')"
      placeholder="abc123"
      class="w-full"
      @change="updateData({ executeId: $event })"
    />
    <p class="text-sm mt-4 text-gray-600 dark:text-gray-200 ml-1 mb-1">
      {{ t('common.globalData') }}
    </p>
    <pre
      v-if="!state.showGlobalData"
      class="rounded-lg text-gray-200 p-4 max-h-80 bg-gray-900 overflow-auto"
      @click="state.showGlobalData = true"
      v-text="data.globalData || '____'"
    />
    <ui-checkbox
      :model-value="data.insertAllVars"
      class="leading-tight mt-4"
      @change="updateData({ insertAllVars: $event })"
    >
      {{ t('workflow.blocks.execute-workflow.insertAllVars') }}
    </ui-checkbox>
    <template v-if="!data.insertAllVars">
      <label class="mt-4 block">
        <span class="text-sm ml-1 block text-gray-600 dark:text-gray-200">
          {{ t('workflow.blocks.execute-workflow.insertVars') }}
        </span>
        <ui-textarea
          :model-value="data.insertVars"
          placeholder="varA,varB,varC"
          @change="updateData({ insertVars: $event })"
        />
      </label>
      <span
        class="text-sm ml-1 block text-gray-600 dark:text-gray-200 leading-tight"
      >
        {{ t('workflow.blocks.execute-workflow.useCommas') }}
      </span>
    </template>
    <ui-modal
      v-model="state.showGlobalData"
      title="Global data"
      content-class="max-w-xl"
    >
      <p>{{ t('workflow.blocks.execute-workflow.overwriteNote') }}</p>
      <shared-codemirror
        :model-value="data.globalData"
        lang="json"
        class="w-full scroll"
        style="height: calc(100vh - 10rem)"
        @change="updateData({ globalData: $event })"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { computed, shallowReactive, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useWorkflowStore } from '@/stores/workflow';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  hideBase: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const route = useRoute();
const workflowStore = useWorkflowStore();

const state = shallowReactive({
  showGlobalData: false,
});

const workflows = computed(() =>
  workflowStore.getWorkflows
    .filter(({ id, drawflow }) => {
      const flow =
        typeof drawflow === 'string' ? drawflow : JSON.stringify(drawflow);

      return id !== route.params.id && !flow.includes(route.params.id);
    })
    .sort((a, b) => (a.name > b.name ? 1 : -1))
);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
