<template>
  <div
    class="block-base relative w-48"
    :data-block-id="blockId"
    @dblclick.stop="$emit('edit')"
  >
    <div
      class="block-menu-container absolute top-0 hidden w-full"
      style="transform: translateY(-100%)"
    >
      <div class="pointer-events-none">
        <p
          title="Block id (click to copy)"
          class="block-menu pointer-events-auto text-overflow inline-block px-1 dark:text-gray-300"
          style="max-width: 96px; margin-bottom: 0"
          @click="insertToClipboard"
        >
          {{ isCopied ? '✅ Copied' : blockId }}
        </p>
      </div>
      <div class="block-menu inline-flex items-center dark:text-gray-300">
        <button
          v-if="!blockData.details?.disableDelete"
          title="Delete block"
          @click.stop="$emit('delete')"
        >
          <v-remixicon size="20" name="riDeleteBin7Line" />
        </button>
        <button
          :title="$t('workflow.blocks.base.settings.title')"
          @click.stop="
            $emit('settings', { details: blockData.details, data, blockId })
          "
        >
          <v-remixicon size="20" name="riSettings3Line" />
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
    <ui-card :class="contentClass" class="block-base__content relative z-10">
      <v-remixicon
        v-if="workflow?.data?.value.testingMode"
        :class="{ 'text-red-500 dark:text-red-400': data.$breakpoint }"
        class="absolute left-0 top-0"
        name="riRecordCircleFill"
        title="Set as breakpoint"
        size="20"
        @click="$emit('update', { $breakpoint: !data.$breakpoint })"
      />
      <slot></slot>
    </ui-card>
    <slot name="append" />
  </div>
</template>
<script setup>
import { inject, ref } from 'vue';
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
defineEmits(['delete', 'edit', 'update', 'settings']);

const isCopied = ref(false);
const workflow = inject('workflow', null);
const workflowUtils = inject('workflow-utils', null);

function insertToClipboard() {
  navigator.clipboard.writeText(props.blockId);

  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 1000);
}
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
