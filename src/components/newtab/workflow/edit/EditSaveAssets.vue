<template>
  <edit-interaction-base
    :data="data"
    :hide="!permission.has.downloads"
    :hide-selector="data.type !== 'element'"
    @change="updateData"
  >
    <template #prepend:selector>
      <ui-select
        class="mb-4"
        :model-value="data.type"
        :label="t('workflow.blocks.save-assets.contentTypes.title')"
        @change="updateData({ type: $event })"
      >
        <option v-for="type in types" :key="type" :value="type">
          {{ t(`workflow.blocks.save-assets.contentTypes.${type}`) }}
        </option>
      </ui-select>
    </template>
    <template #prepend>
      <template v-if="!permission.has.downloads">
        <p class="mt-4">
          {{ t('workflow.blocks.handle-download.noPermission') }}
        </p>
        <ui-button variant="accent" class="mt-2" @click="permission.request">
          {{ t('workflow.blocks.clipboard.grantPermission') }}
        </ui-button>
      </template>
    </template>
    <edit-autocomplete v-if="data.type === 'url'">
      <ui-input
        :model-value="data.url"
        label="URL"
        class="w-full"
        autocomplete="off"
        placeholder="https://example.com/picture.png"
        @change="updateData({ url: $event })"
      />
    </edit-autocomplete>
    <template v-if="permission.has.downloads">
      <edit-autocomplete class="mt-4">
        <ui-input
          :model-value="data.filename"
          :label="t('workflow.blocks.save-assets.filename')"
          class="w-full"
          autocomplete="off"
          placeholder="image.jpeg"
          @change="updateData({ filename: $event })"
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
      <hr class="w-full my-4" />
      <label class="flex items-center">
        <ui-switch
          :model-value="data.saveDownloadIds"
          @change="updateData({ saveDownloadIds: $event })"
        />
        <p class="ml-2">
          {{ t('workflow.blocks.save-assets.saveDownloadIds') }}
        </p>
      </label>
      <insert-workflow-data
        v-if="data.saveDownloadIds"
        :data="data"
        variables
        @update="updateData"
      />
    </template>
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useHasPermissions } from '@/composable/hasPermissions';
import EditInteractionBase from './EditInteractionBase.vue';
import EditAutocomplete from './EditAutocomplete.vue';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const permission = useHasPermissions(['downloads']);

const types = ['element', 'url'];
const onConflict = ['uniquify', 'overwrite', 'prompt'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
