<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-checkbox
      :model-value="data.accept"
      block
      class="mt-4"
      @change="updateData({ accept: $event })"
    >
      {{ t('workflow.blocks.handle-dialog.accept') }}
    </ui-checkbox>
    <edit-autocomplete v-if="data.accept" class="mt-1">
      <ui-input
        :model-value="data.promptText"
        :label="t('workflow.blocks.handle-dialog.promptText.label')"
        :title="t('workflow.blocks.handle-dialog.promptText.description')"
        autocomplete="off"
        placeholder="Text"
        class="w-full"
        @change="updateData({ promptText: $event })"
      />
    </edit-autocomplete>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
