<template>
  <block-base
    :id="componentId"
    :hide-edit="block.details.disableEdit"
    :hide-delete="block.details.disableDelete"
    :minimap="editor.minimap"
    class="block-basic"
    @edit="editBlock"
    @delete="editor.removeNodeId(`node-${block.id}`)"
  >
    <div class="flex items-center">
      <span
        :class="
          block.data.disableBlock ? 'bg-box-transparent' : block.category.color
        "
        class="inline-block p-2 mr-2 rounded-lg dark:text-black"
      >
        <v-remixicon :name="block.details.icon || 'riGlobalLine'" />
      </span>
      <div style="max-width: 200px">
        <p
          v-if="block.details.id"
          class="font-semibold leading-none whitespace-nowrap"
        >
          {{ t(`workflow.blocks.${block.details.id}.name`) }}
        </p>
        <p class="text-gray-600 dark:text-gray-200 text-overflow leading-tight">
          {{ block.data.description }}
        </p>
        <input
          type="text"
          class="hidden trigger"
          disabled="true"
          @change="handleDataChange"
        />
      </div>
    </div>
    <div
      v-if="
        block.data.onError?.enable && block.data.onError?.toDo === 'fallback'
      "
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
    <slot :block="block"></slot>
    <template #prepend>
      <div
        v-if="!editor.minimap && block.details.id !== 'trigger'"
        :title="t('workflow.blocks.base.moveToGroup')"
        draggable="true"
        class="bg-white dark:bg-gray-700 invisible move-to-group z-50 absolute -top-2 -right-2 rounded-md p-1 shadow-md"
        @dragstart="handleStartDrag"
        @mousedown.stop
      >
        <v-remixicon name="riDragDropLine" size="20" />
      </div>
    </template>
  </block-base>
</template>
<script setup>
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import emitter from '@/lib/mitt';
import { useEditorBlock } from '@/composable/editorBlock';
import { useComponentId } from '@/composable/componentId';
import BlockBase from './BlockBase.vue';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const componentId = useComponentId('block-base');
const block = useEditorBlock(`#${componentId}`, props.editor);

function editBlock() {
  emitter.emit('editor:edit-block', {
    ...block.details,
    data: block.data,
    blockId: block.id,
  });
}
function handleDataChange() {
  const { data } = props.editor.getNodeFromId(block.id);

  block.data = data;
}
function handleStartDrag(event) {
  const payload = {
    data: block.data,
    id: block.details.id,
    blockId: block.id,
    fromBlockBasic: true,
  };

  event.dataTransfer.setData('block', JSON.stringify(payload));
}

watch(
  () => block.data.onError,
  (onError) => {
    if (!onError) return;

    const blockDetail = props.editor.getNodeFromId(block.id);
    const outputLen = Object.keys(blockDetail.outputs).length;

    if (!onError.enable || onError.toDo !== 'fallback') {
      block.containerEl.classList.toggle('block-basic-fallback', false);

      if (outputLen > 1) props.editor.removeNodeOutput(block.id, 'output_2');

      return;
    }

    block.containerEl.classList.toggle('block-basic-fallback', true);

    if (outputLen < 2) {
      props.editor.addNodeOutput(block.id);
    }

    props.editor.updateConnectionNodes(`node-${block.id}`);
  },
  { deep: true }
);
</script>
<style>
.drawflow-node.selected .move-to-group,
.block-basic:hover .move-to-group {
  visibility: visible;
}
.block-basic-fallback .output_2 {
  top: 11px;
}
</style>
