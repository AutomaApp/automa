<template>
  <div class="block-base relative w-48" @dblclick.stop="$emit('edit')">
    <div
      class="top-0 w-full absolute block-menu-container hidden"
      style="transform: translateY(-100%)"
    >
      <div class="inline-flex items-center dark:text-gray-300 block-menu">
        <button
          v-if="!blockData.details?.disableDelete"
          title="Delete block"
          @click.stop="$emit('delete')"
        >
          <v-remixicon size="20" name="riDeleteBin7Line" />
        </button>
        <button
          v-if="!excludeGroupBlocks.includes(blockData.details?.id)"
          :title="$t('workflow.blocks.base.moveToGroup')"
          draggable="true"
          class="cursor-move"
          @dragstart="handleStartDrag"
          @mousedown.stop
        >
          <v-remixicon name="riDragDropLine" size="20" />
        </button>
        <button
          v-if="blockData.details?.id !== 'trigger'"
          title="Enable/Disable block"
          @click.stop="$emit('update', { disableBlock: !data.disableBlock })"
        >
          <v-remixicon
            size="20"
            :name="data.disableBlock ? 'riToggleLine' : 'riToggleFill'"
          />
        </button>
        <button title="Run workflow from here" @click.stop="runWorkflow">
          <v-remixicon size="20" name="riPlayLine" />
        </button>
        <button
          v-if="!blockData.details?.disableEdit"
          title="Edit block"
          @click="$emit('edit')"
        >
          <v-remixicon size="20" name="riPencilLine" />
        </button>
        <slot name="action" />
      </div>
    </div>
    <slot name="prepend" />
    <ui-card :class="contentClass" class="z-10 relative block-base__content">
      <slot></slot>
    </ui-card>
    <slot name="append" />
  </div>
</template>
<script setup>
import { inject } from 'vue';
import { excludeGroupBlocks } from '@/utils/shared';

const props = defineProps({
  contentClass: {
    type: String,
    default: '',
  },
  blockData: {
    type: Object,
    default: () => ({}),
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  blockId: {
    type: String,
    default: '',
  },
});
defineEmits(['delete', 'edit', 'update']);

const workflowUtils = inject('workflow-utils', null);

function handleStartDrag(event) {
  const payload = {
    data: props.data,
    fromBlockBasic: true,
    blockId: props.blockId,
    id: props.blockData.details.id,
  };

  event.dataTransfer.setData('block', JSON.stringify(payload));
}
function runWorkflow() {
  if (!workflowUtils) return;

  workflowUtils.executeFromBlock(props.blockId);
}
</script>
<style>
.block-menu {
  @apply mb-1 bg-box-transparent-2 rounded-md;
  button {
    padding-left: 6px;
    padding-right: 6px;
    @apply focus:ring-0 py-1 hover:text-primary;
  }
}
</style>
