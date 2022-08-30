<template>
  <block-base
    :id="componentId"
    :data-position="JSON.stringify(position)"
    class="w-64"
    @edit="$emit('edit')"
    @delete="$emit('delete', id)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="flex items-center">
      <div
        :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg dark:text-black"
      >
        <v-remixicon name="riAB" size="20" class="inline-block mr-1" />
        <span>{{ t('workflow.blocks.conditions.name') }}</span>
      </div>
    </div>
    <p
      v-show="data.description"
      class="text-gray-600 mt-2 dark:text-gray-200 text-overflow leading-tight"
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
        class="flex items-center flex-1 p-2 bg-box-transparent rounded-lg w-full relative"
      >
        <p
          v-if="item.name"
          class="text-overflow w-full text-right"
          :title="item.name"
        >
          {{ item.name }}
        </p>
        <template v-else>
          <p class="w-5/12 text-overflow text-right">
            {{ item.compareValue || '_____' }}
          </p>
          <p class="w-2/12 text-center mx-1 font-mono">
            {{ item.type }}
          </p>
          <p class="w-5/12 text-overflow">
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
