<template>
  <block-base
    :id="componentId"
    class="element-exists"
    style="width: 195px"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div
      :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
      class="inline-block text-sm mb-2 p-2 rounded-lg dark:text-black"
    >
      <v-remixicon name="riFocus3Line" size="20" class="inline-block mr-1" />
      <span>{{ t('workflow.blocks.element-exists.name') }}</span>
    </div>
    <p
      :title="t('workflow.blocks.element-exists.selector')"
      :class="{ 'font-mono': !data.description }"
      class="text-overflow p-2 rounded-lg bg-box-transparent text-sm text-right mb-2"
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
import { Handle, Position } from '@braks/vue-flow';
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
defineEmits(['delete', 'edit']);

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
