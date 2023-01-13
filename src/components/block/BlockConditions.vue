<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="w-64"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="flex items-center">
      <div
        :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
        class="mr-4 inline-block rounded-lg p-2 text-sm dark:text-black"
      >
        <v-remixicon name="riAB" size="20" class="mr-1 inline-block" />
        <span>{{ t('workflow.blocks.conditions.name') }}</span>
      </div>
    </div>
    <p
      v-show="data.description"
      class="text-overflow mt-2 leading-tight text-gray-600 dark:text-gray-200"
    >
      {{ data.description }}
    </p>
    <ul
      v-if="data.conditions && data.conditions.length !== 0"
      class="mt-4 space-y-2"
    >
      <li
        v-for="item in data.conditions"
        :key="item.id"
        class="bg-box-transparent relative flex w-full flex-1 items-center rounded-lg p-2"
        @dblclick.stop="$emit('edit', { editCondition: item.id })"
      >
        <p
          v-if="item.name"
          class="text-overflow w-full text-right"
          :title="item.name"
        >
          {{ item.name }}
        </p>
        <template v-else>
          <p class="text-overflow w-5/12 text-right">
            {{ item.compareValue || '_____' }}
          </p>
          <p class="mx-1 w-2/12 text-center font-mono">
            {{ item.type }}
          </p>
          <p class="text-overflow w-5/12">
            {{ item.value || '_____' }}
          </p>
        </template>
        <Handle
          :id="`${id}-output-${item.id}`"
          :position="Position.Right"
          style="margin-right: -33px"
          type="source"
        />
      </li>
      <p
        v-if="data.conditions && data.conditions.length !== 0"
        class="text-right text-gray-600 dark:text-gray-200"
      >
        <span title="Fallback"> &#9432; </span>
        Fallback
      </p>
    </ul>
    <Handle
      v-if="data.conditions.length > 0"
      :id="`${id}-output-fallback`"
      :position="Position.Right"
      type="source"
      style="top: auto; bottom: 10px"
    />
  </block-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { Handle, Position } from '@vue-flow/core';
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
defineEmits(['delete', 'settings', 'edit', 'update']);

const { t } = useI18n();
const componentId = useComponentId('block-conditions');
const block = useEditorBlock(props.label);
</script>
<style>
.condition-handle {
  position: relative !important;
  top: 82px !important;
  margin-bottom: 32px !important;
}
</style>
