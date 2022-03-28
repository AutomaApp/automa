<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <template v-if="permission.has.clipboardRead">
      <p class="mt-4">
        {{ t('workflow.blocks.clipboard.data') }}
      </p>
      <insert-workflow-data :data="data" variables @update="updateData" />
    </template>
    <template v-else>
      <p class="mt-4">
        {{ t('workflow.blocks.clipboard.noPermission') }}
      </p>
      <ui-button variant="accent" class="mt-2" @click="permission.request">
        {{ t('workflow.blocks.clipboard.grantPermission') }}
      </ui-button>
    </template>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useHasPermissions } from '@/composable/hasPermissions';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const permission = useHasPermissions(['clipboardRead']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
