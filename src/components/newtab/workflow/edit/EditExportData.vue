<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <template v-if="!permission.has.downloads">
      <p class="mt-4">
        {{ t('workflow.blocks.handle-download.noPermission') }}
      </p>
      <ui-button variant="accent" class="mt-2" @click="permission.request">
        {{ t('workflow.blocks.clipboard.grantPermission') }}
      </ui-button>
    </template>
    <template v-else>
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
      <ui-input
        v-if="data.dataToExport === 'google-sheets'"
        :model-value="data.refKey"
        :title="t('workflow.blocks.export-data.refKey')"
        :placeholder="t('workflow.blocks.export-data.refKey')"
        class="w-full mt-2"
        @change="updateData({ refKey: $event })"
      />
      <ui-input
        v-if="data.dataToExport === 'variable'"
        :model-value="data.variableName"
        :title="t('workflow.variables.name')"
        :placeholder="t('workflow.variables.name')"
        class="w-full mt-2"
        @change="updateData({ variableName: $event })"
      />
      <edit-autocomplete class="mt-2">
        <ui-input
          :model-value="data.name"
          autocomplete="off"
          label="File name"
          class="w-full"
          placeholder="unnamed"
          @change="updateData({ name: $event })"
        />
      </edit-autocomplete>
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
      <ui-expand
        v-if="data.type === 'csv'"
        hide-header-icon
        header-class="flex items-center focus:ring-0 w-full"
      >
        <template #header="{ show }">
          <v-remixicon
            :rotate="show ? 270 : 180"
            name="riArrowLeftSLine"
            class="transition-transform text-gray-600 dark:text-gray-300"
          />
          {{ t('common.options') }}
        </template>
        <div class="pl-6 mt-1">
          <ui-checkbox
            v-if="data.type === 'csv'"
            :model-value="data.addBOMHeader"
            @change="updateData({ addBOMHeader: $event })"
          >
            {{ t('workflow.blocks.export-data.bomHeader') }}
          </ui-checkbox>
          <ui-input
            :model-value="data.csvDelimiter"
            label="Delimiter"
            class="mt-1"
            placeholder=","
            @change="updateData({ csvDelimiter: $event })"
          />
        </div>
      </ui-expand>
    </template>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { dataExportTypes } from '@/utils/shared';
import { useHasPermissions } from '@/composable/hasPermissions';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const dataToExport = ['data-columns', 'google-sheets', 'variable'];
const onConflict = ['uniquify', 'overwrite', 'prompt'];

const { t } = useI18n();
const permission = useHasPermissions(['downloads']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
