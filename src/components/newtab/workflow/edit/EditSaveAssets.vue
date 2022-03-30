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
    <ui-input
      v-if="data.type === 'url'"
      :model-value="data.url"
      label="URL"
      class="w-full"
      placeholder="https://example.com/picture.png"
      @change="updateData({ url: $event })"
    />
    <template v-if="true">
      <ui-input
        :model-value="data.filename"
        :label="t('workflow.blocks.save-assets.filename')"
        class="w-full mt-4"
        placeholder="image.jpeg"
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
    </template>
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useHasPermissions } from '@/composable/hasPermissions';
import EditInteractionBase from './EditInteractionBase.vue';

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
