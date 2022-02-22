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
      <ui-input
        v-if="data.responseType === 'json'"
        :model-value="data.dataPath"
        placeholder="path.to.data"
        label="Data path"
        class="w-full mt-2"
        @change="updateData({ dataPath: $event })"
      />
      <ui-checkbox
        :model-value="data.assignVariable"
        block
        class="mt-4"
        @change="updateData({ assignVariable: $event })"
      >
        {{ t('workflow.variables.assign') }}
      </ui-checkbox>
      <ui-input
        v-if="data.assignVariable"
        :model-value="data.variableName"
        :placeholder="t('workflow.variables.name')"
        :title="t('workflow.variables.name')"
        class="mt-2 w-full"
        @change="updateData({ variableName: $event })"
      />
      <ui-checkbox
        :model-value="data.saveData"
        block
        class="mt-4"
        @change="updateData({ saveData: $event })"
      >
        {{ t('workflow.blocks.get-text.checkbox') }}
      </ui-checkbox>
      <ui-select
        v-if="data.saveData"
        :model-value="data.dataColumn"
        placeholder="Select column"
        class="mt-2 w-full"
        @change="updateData({ dataColumn: $event })"
      >
        <option
          v-for="column in workflow.data.value.table"
          :key="column.name"
          :value="column.name"
        >
          {{ column.name }}
        </option>
      </ui-select>
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
import { ref, inject, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const permission = { permissions: ['clipboardRead'] };
const { t } = useI18n();

const workflow = inject('workflow');
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
