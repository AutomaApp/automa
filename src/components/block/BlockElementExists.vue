<template>
  <block-base
    :id="componentId"
    class="element-exists"
    @edit="editBlock"
    @delete="editor.removeNodeId(`node-${block.id}`)"
  >
    <div
      :class="
        block.data.disableBlock ? 'bg-box-transparent' : block.category.color
      "
      class="inline-block text-sm mb-2 p-2 rounded-lg dark:text-black"
    >
      <v-remixicon name="riFocus3Line" size="20" class="inline-block mr-1" />
      <span>{{ t('workflow.blocks.element-exists.name') }}</span>
    </div>
    <p
      :title="t('workflow.blocks.element-exists.selector')"
      class="text-overflow p-2 rounded-lg bg-box-transparent text-sm font-mono text-right mb-2"
      style="max-width: 200px"
    >
      {{ block.data.selector || t('workflow.blocks.element-exists.selector') }}
    </p>
    <p class="text-right text-gray-600 dark:text-gray-200">
      <span :title="t('workflow.blocks.element-exists.fallbackTitle')">
        &#9432;
      </span>
      {{ t('common.fallback') }}
    </p>
    <input
      type="text"
      class="hidden trigger"
      disabled="true"
      @change="handleDataChanged"
    />
  </block-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import emitter from '@/lib/mitt';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';
import BlockBase from './BlockBase.vue';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const componentId = useComponentId('block-delay');
const block = useEditorBlock(`#${componentId}`, props.editor);

function editBlock() {
  emitter.emit('editor:edit-block', {
    ...block.details,
    data: block.data,
    blockId: block.id,
  });
}
function handleDataChanged() {
  const { data } = props.editor.getNodeFromId(block.id);

  block.data = data;
}
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
