<template>
  <div>
    <template v-if="permission.has.downloads">
      <ui-textarea
        :model-value="data.description"
        class="w-full"
        :placeholder="t('common.description')"
        @change="updateData({ description: $event })"
      />
      <ui-input
        :model-value="data.timeout"
        :label="t('workflow.blocks.handle-download.timeout')"
        placeholder="1000"
        type="number"
        class="w-full mt-2"
        @change="updateData({ timeout: +$event || 1000 })"
      />
      <ui-input
        :model-value="data.filename"
        :label="`${t('common.fileName')} (${t('common.optional')})`"
        placeholder="file"
        class="mt-2 w-full"
        @change="updateData({ filename: $event })"
      />
      <ui-select
        :model-value="data.onConflict"
        :label="t('workflow.blocks.handle-download.onConflict')"
        class="mt-2 w-full"
        @change="updateData({ onConflict: $event })"
      >
        <option v-for="item in onConflict" :key="item" :value="item">
          {{ t(`workflow.blocks.base.downloads.onConflict.${item}`) }}
        </option>
      </ui-select>
      <ui-checkbox
        :model-value="data.waitForDownload"
        class="mt-4"
        @change="updateData({ waitForDownload: $event })"
      >
        {{ t('workflow.blocks.handle-download.waitFile') }}
      </ui-checkbox>
      <insert-workflow-data
        v-if="data.waitForDownload"
        :data="data"
        variables
        @update="updateData"
      />
    </template>
    <template v-else>
      <p class="mt-4">
        {{ t('workflow.blocks.handle-download.noPermission') }}
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

const permission = useHasPermissions(['downloads']);
const onConflict = ['uniquify', 'overwrite', 'prompt'];

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
