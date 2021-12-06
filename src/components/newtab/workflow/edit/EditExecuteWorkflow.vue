<template>
  <div>
    <ui-select
      :model-value="data.workflowId"
      :placeholder="t('workflow.blocks.execute-workflow.select')"
      class="w-full mb-4"
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
    <p>{{ t('common.globalData') }}</p>
    <prism-editor
      v-if="!state.showGlobalData"
      :model-value="data.globalData"
      :highlight="highlighter('json')"
      readonly
      class="p-4 max-h-80"
      @click="state.showGlobalData = true"
    />
    <ui-modal
      v-model="state.showGlobalData"
      title="Global data"
      content-class="max-w-xl"
    >
      <p>{{ t('workflow.blocks.execute-workflow.overwriteNote') }}</p>
      <prism-editor
        :model-value="state.globalData"
        :highlight="highlighter('json')"
        class="w-full scroll"
        style="height: calc(100vh - 10rem)"
        @input="updateGlobalData"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { computed, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { PrismEditor } from 'vue-prism-editor';
import { highlighter } from '@/lib/prism';
import Workflow from '@/models/workflow';

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

const state = shallowReactive({
  showGlobalData: false,
  globalData: `${props.data.globalData}`,
});

const workflows = computed(() =>
  Workflow.query()
    .where(
      ({ id, drawflow }) =>
        id !== route.params.id && !drawflow.includes(route.params.id)
    )
    .orderBy('name', 'asc')
    .get()
);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateGlobalData(event) {
  const { value } = event.target;

  state.globalData = value;
  updateData({ globalData: value });
}
</script>
