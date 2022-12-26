<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-checkbox
      :model-value="data.openInNewTab"
      class="mt-4"
      @change="updateData({ openInNewTab: $event })"
    >
      {{ t('workflow.blocks.link.openInNewTab') }}
    </ui-checkbox>
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import EditInteractionBase from './EditInteractionBase.vue';

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
