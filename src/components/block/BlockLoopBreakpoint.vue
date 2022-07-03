<template>
  <ui-card :id="componentId" class="w-48">
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg dark:text-black text-overflow"
      >
        <v-remixicon name="riStopLine" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.loop-breakpoint.name') }}</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer"
        @click.stop="$emit('delete', id)"
      />
    </div>
    <input
      :value="data.loopId"
      class="px-4 py-2 rounded-lg w-full bg-input"
      placeholder="Loop ID"
      type="text"
      required
      @input="handleInput"
    />
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
  </ui-card>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import emitter from '@/lib/mitt';
import { Handle, Position } from '@braks/vue-flow';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

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
defineEmits(['delete']);

const { t } = useI18n();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-delay');

function handleInput({ target }) {
  const loopId = target.value.replace(/\s/g, '');

  props.editor.updateNodeDataFromId(block.id, { loopId });
  emitter.emit('editor:data-changed', block.id);
}
</script>
