<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.timeout"
      type="number"
      label="Timeout (millisecond) (0 to disable)"
      class="mt-2 w-full"
      @change="updateData({ timeout: +$event })"
    />
    <ui-button
      class="mt-4 w-full"
      variant="accent"
      @click="showModal = !showModal"
    >
      Insert Parameters
    </ui-button>
    <ui-modal v-model="showModal" title="Parameters" content-class="max-w-4xl">
      <edit-workflow-parameters
        :data="data.parameters"
        hide-prefer-tab
        @update="updateData({ parameters: $event })"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import EditWorkflowParameters from './EditWorkflowParameters.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const showModal = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
