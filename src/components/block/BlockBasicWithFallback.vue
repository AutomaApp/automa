<template>
  <block-base
    :id="componentId"
    :hide-edit="block.details.disableEdit"
    :hide-delete="block.details.disableDelete"
    class="block-basic group"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
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
    <template #prepend>
      <div
        v-if="block.details.id !== 'trigger'"
        :title="t('workflow.blocks.base.moveToGroup')"
        draggable="true"
        class="bg-white dark:bg-gray-700 invisible group-hover:visible z-50 absolute -top-2 -right-2 rounded-md p-1 shadow-md"
        @dragstart="handleStartDrag"
        @mousedown.stop
      >
        <v-remixicon name="riDragDropLine" size="20" />
      </div>
    </template>
  </block-base>
</template>
<script setup>
import { Handle, Position } from '@braks/vue-flow';
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
});
defineEmits(['delete', 'edit', 'update']);

const { t } = useI18n();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-base');

function handleStartDrag(event) {
  const payload = {
    data: block.data,
    id: block.details.id,
    blockId: block.id,
    fromBlockBasic: true,
  };

  event.dataTransfer.setData('block', JSON.stringify(payload));
}
</script>
