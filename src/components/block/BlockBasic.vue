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
    @settings="$emit('settings', $event)"
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
        class="mr-2 inline-block rounded-lg p-2 dark:text-black"
      >
        <svg
          v-if="block.details.name === 'AI Workflow'"
          width="31.2"
          height="31.2"
          viewBox="0 0 14 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.22626 4.28601V8.14343H1.36884V4.28601H5.22626Z"
            stroke="black"
          />
          <path
            d="M12.6076 0.50061V3.64319H9.46503V0.50061H12.6076Z"
            stroke="black"
          />
          <path
            d="M12.6309 8.35657V11.4991H9.48834V8.35657H12.6309Z"
            stroke="black"
          />
          <path d="M5.66516 6.37384H7.27247V2.13159H9.45839" stroke="black" />
          <path d="M5.15082 6.43445H7.26688V9.9986H9.91184" stroke="black" />
        </svg>

        <v-remixicon
          v-else
          :path="getIconPath(block.details.icon)"
          :name="block.details.icon || 'riGlobalLine'"
        />
      </span>
      <div class="flex-1 overflow-hidden">
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
        <p
          v-if="block.details.id"
          class="text-overflow whitespace-nowrap font-semibold leading-tight"
        >
          {{ getBlockName() }}
        </p>
        <p
          :class="{ 'mb-1': data.description && data.loopId }"
          class="text-overflow leading-tight text-gray-600 dark:text-gray-200"
        >
          {{ data.description }}
        </p>
        <span
          v-if="showTextToCopy"
          :title="showTextToCopy.name + ' (click to copy)'"
          class="bg-box-transparent text-overflow absolute bottom-0 right-0 rounded-sm rounded-br-lg py-px px-1 text-xs text-gray-600 dark:text-gray-200"
          style="max-width: 40%; cursor: pointer"
          @click.stop="insertToClipboard(showTextToCopy.value)"
        >
          {{ state.isCopied ? '✅ Copied' : showTextToCopy.value }}
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
import { useBlockValidation } from '@/composable/blockValidation';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';
import { Handle, Position } from '@vue-flow/core';
import { computed, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
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
defineEmits(['delete', 'edit', 'update', 'settings']);

const loopBlocks = ['loop-data', 'loop-elements'];

const { t, te } = useI18n();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-base');
const { errors: blockErrors } = useBlockValidation(
  props.label,
  () => props.data
);

const state = shallowReactive({
  isCopied: false,
});

const showTextToCopy = computed(() => {
  if (loopBlocks.includes(block.details.id) && props.data.loopId) {
    return {
      name: 'Loop id',
      value: props.data.loopId,
    };
  }

  if (block.details.id === 'google-sheets' && props.data.refKey) {
    return {
      name: 'Reference key',
      value: props.data.refKey,
    };
  }

  return null;
});

function insertToClipboard(text) {
  navigator.clipboard.writeText(text);

  state.isCopied = true;
  setTimeout(() => {
    state.isCopied = false;
  }, 1000);
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
