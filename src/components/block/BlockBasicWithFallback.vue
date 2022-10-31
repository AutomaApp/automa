<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="block-basic group"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="flex items-center">
      <span
        :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
        class="inline-block p-2 mr-2 rounded-lg dark:text-black"
      >
        <v-remixicon :name="block.details.icon || 'riGlobalLine'" />
      </span>
      <div class="overflow-hidden flex-1">
        <p
          v-if="block.details.id"
          class="font-semibold leading-tight text-overflow whitespace-nowrap"
        >
          {{ t(`workflow.blocks.${block.details.id}.name`) }}
        </p>
        <p class="text-gray-600 dark:text-gray-200 text-overflow leading-tight">
          {{ data.description }}
        </p>
      </div>
    </div>
    <span
      v-if="blockErrors"
      v-tooltip="{
        allowHTML: true,
        content: blockErrors,
      }"
      class="absolute top-2 right-2 text-red-500 dark:text-red-400"
    >
      <v-remixicon name="riAlertLine" size="20" />
    </span>
    <slot :block="block"></slot>
    <div class="fallback flex items-center justify-end">
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
import { useBlockValidation } from '@/composable/blockValidation';
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
});
defineEmits(['delete', 'edit', 'update', 'settings']);

const { t } = useI18n();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-base');
const { errors: blockErrors } = useBlockValidation(
  props.label,
  () => props.data
);
</script>
