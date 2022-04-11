<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.dataToExport"
      :label="t('workflow.blocks.export-data.dataToExport.placeholder')"
      class="w-full mt-2"
      @change="updateData({ dataToExport: $event })"
    >
      <option v-for="option in dataToExport" :key="option" :value="option">
        {{ t(`workflow.blocks.export-data.dataToExport.options.${option}`) }}
      </option>
    </ui-select>
    <ui-autocomplete
      :items="autocomplete"
      :trigger-char="['{{', '}}']"
      block
      hide-empty
      class="mt-2"
    >
      <ui-input
        :model-value="data.name"
        autocomplete="off"
        label="File name"
        class="w-full"
        placeholder="unnamed"
        @change="updateData({ name: $event })"
      />
    </ui-autocomplete>
    <ui-select
      v-if="permission.has.downloads"
      :model-value="data.onConflict"
      :label="t('workflow.blocks.handle-download.onConflict')"
      class="mt-2 w-full"
      @change="updateData({ onConflict: $event })"
    >
      <option v-for="item in onConflict" :key="item" :value="item">
        {{ t(`workflow.blocks.base.downloads.onConflict.${item}`) }}
      </option>
    </ui-select>
    <ui-input
      v-if="data.dataToExport === 'google-sheets'"
      :model-value="data.refKey"
      :title="t('workflow.blocks.export-data.refKey')"
      :placeholder="t('workflow.blocks.export-data.refKey')"
      class="w-full mt-2"
      @change="updateData({ refKey: $event })"
    />
    <ui-select
      :model-value="data.type"
      :label="t('workflow.blocks.export-data.exportAs')"
      class="w-full mt-2"
      @change="updateData({ type: $event })"
    >
      <option v-for="type in dataExportTypes" :key="type.id" :value="type.id">
        {{ type.name }}
      </option>
    </ui-select>
    <ui-checkbox
      v-if="data.type === 'csv'"
      :model-value="data.addBOMHeader"
      class="mt-2"
      @change="updateData({ addBOMHeader: $event })"
    >
      {{ t('workflow.blocks.export-data.bomHeader') }}
    </ui-checkbox>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { dataExportTypes } from '@/utils/shared';
import { useHasPermissions } from '@/composable/hasPermissions';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  autocomplete: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:data']);

const dataToExport = ['data-columns', 'google-sheets'];
const onConflict = ['uniquify', 'overwrite', 'prompt'];

const { t } = useI18n();
const permission = useHasPermissions(['downloads']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
