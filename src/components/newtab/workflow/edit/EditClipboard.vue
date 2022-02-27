<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <template v-if="hasPermission">
      <p class="mt-4">
        {{ t('workflow.blocks.clipboard.data') }}
      </p>
      <insert-workflow-data :data="data" variables @update="updateData" />
    </template>
    <template v-else>
      <p class="mt-4">
        {{ t('workflow.blocks.clipboard.noPermission') }}
      </p>
      <ui-button variant="accent" class="mt-2" @click="requestPermission">
        {{ t('workflow.blocks.clipboard.grantPermission') }}
      </ui-button>
    </template>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const permission = { permissions: ['clipboardRead'] };
const { t } = useI18n();

const hasPermission = ref(false);

function handlePermission(status) {
  hasPermission.value = status;
}
function requestPermission() {
  browser.permissions.request(permission).then(handlePermission);
}
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

onMounted(() => {
  browser.permissions.contains(permission).then(handlePermission);
});
</script>
