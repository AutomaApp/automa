<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    style="width: 195px"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div
      :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
      class="mb-2 inline-block rounded-lg p-2 text-sm dark:text-black"
    >
      <v-remixicon name="riFocus3Line" size="20" class="mr-1 inline-block" />
      <span>{{ t('workflow.blocks.element-exists.name') }}</span>
    </div>
    <p
      :title="t('workflow.blocks.element-exists.selector')"
      :class="{ 'font-mono': !data.description }"
      class="text-overflow bg-box-transparent mb-2 rounded-lg p-2 text-right text-sm"
      style="max-width: 200px"
    >
      {{
        data.description ||
        data.selector ||
        t('workflow.blocks.element-exists.selector')
      }}
    </p>
    <p class="text-right text-gray-600 dark:text-gray-200">
      <span :title="t('workflow.blocks.element-exists.fallbackTitle')">
        &#9432;
      </span>
      {{ t('common.fallback') }}
    </p>
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
    <Handle
      :id="`${id}-output-2`"
      type="source"
      :position="Position.Right"
      style="top: auto; bottom: 12px"
    />
  </block-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { Handle, Position } from '@vue-flow/core';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';
import BlockBase from './BlockBase.vue';

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['delete', 'edit', 'update', 'settings']);

const { t } = useI18n();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-delay');
</script>
<style>
.drawflow .element-exists .outputs {
  top: 70px !important;
  transform: none !important;
}
.drawflow .element-exists .output {
  margin-bottom: 22px;
}
</style>
