<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    :data-position="JSON.stringify(position)"
    class="block-basic group"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
  >
    <Handle
      v-if="label !== 'trigger'"
      :id="`${id}-input-1`"
      type="target"
      :position="Position.Left"
    />
    <div class="flex items-center">
      <span
        :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
        class="inline-block p-2 mr-2 rounded-lg dark:text-black"
      >
        <v-remixicon
          :path="getIconPath(block.details.icon)"
          :name="block.details.icon || 'riGlobalLine'"
        />
      </span>
      <div class="overflow-hidden flex-1">
        <p
          v-if="block.details.id"
          class="font-semibold leading-tight text-overflow whitespace-nowrap"
        >
          {{ getBlockName() }}
        </p>
        <p
          :class="{ 'mb-1': data.description && data.loopId }"
          class="text-gray-600 dark:text-gray-200 text-overflow leading-tight"
        >
          {{ data.description }}
        </p>
        <span
          v-if="data.loopId"
          class="bg-box-transparent rounded-br-lg text-gray-600 dark:text-gray-200 text-overflow rounded-sm py-px px-1 text-xs absolute bottom-0 right-0"
          title="Loop Id (click to copy)"
          style="max-width: 40%; cursor: pointer"
          @click.stop="copyLoopId"
        >
          {{ data.loopId }}
        </span>
      </div>
    </div>
    <slot :block="block"></slot>
    <div
      v-if="data.onError?.enable && data.onError?.toDo === 'fallback'"
      class="fallback flex items-center justify-end"
    >
      <v-remixicon
        v-if="block"
        :title="t('workflow.blocks.base.onError.fallbackTitle')"
        name="riInformationLine"
        size="18"
      />
      <span class="ml-1">
        {{ t('common.fallback') }}
      </span>
    </div>
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
    <Handle
      v-if="data.onError?.enable && data.onError?.toDo === 'fallback'"
      :id="`${id}-output-fallback`"
      type="source"
      :position="Position.Right"
      style="top: auto; bottom: 10px"
    />
  </block-base>
</template>
<script setup>
import { Handle, Position } from '@vue-flow/core';
import { useI18n } from 'vue-i18n';
import { useEditorBlock } from '@/composable/editorBlock';
import { useComponentId } from '@/composable/componentId';
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
  position: {
    type: Object,
    default: () => ({}),
  },
  events: {
    type: Object,
    default: () => ({}),
  },
  dimensions: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['delete', 'edit', 'update']);

const { t, te } = useI18n();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-base');

function copyLoopId() {
  navigator.clipboard.writeText(props.data.loopId);
}
function getBlockName() {
  const key = `workflow.blocks.${block.details.id}.name`;

  return te(key) ? t(key) : block.details.name;
}
function getIconPath(path) {
  if (path && path.startsWith('path')) {
    const { 1: iconPath } = path.split(':');
    return iconPath;
  }

  return '';
}
</script>
