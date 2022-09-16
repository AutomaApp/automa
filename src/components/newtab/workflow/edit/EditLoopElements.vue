<template>
  <edit-interaction-base
    :data="data"
    hide-multiple
    hide-mark-el
    @change="updateData"
  >
    <template #prepend:selector>
      <ui-input
        :model-value="data.loopId"
        class="w-full mb-4"
        :label="t('workflow.blocks.loop-data.loopId')"
        :placeholder="t('workflow.blocks.loop-data.loopId')"
        @change="updateLoopId"
      />
    </template>
    <ui-input
      :model-value="data.maxLoop"
      :label="t('workflow.blocks.loop-data.maxLoop.label')"
      :title="t('workflow.blocks.loop-data.maxLoop.title')"
      class="w-full mt-3"
      @change="updateData({ maxLoop: $event })"
    />
    <div class="mt-4 border-t pt-4 mb-8">
      <p class="text-sm text-gray-600 dark:text-gray-200">
        {{ t('workflow.blocks.loop-elements.loadMore') }}
      </p>
      <ui-select
        :model-value="data.loadMoreAction"
        :label="t('common.action')"
        class="mt-2"
        @change="updateData({ loadMoreAction: $event })"
      >
        <option v-for="action in actions" :key="action" :value="action">
          {{ t(`workflow.blocks.loop-elements.actions.${action}`) }}
        </option>
      </ui-select>
      <ui-input
        v-if="['click-element', 'click-link'].includes(data.loadMoreAction)"
        :model-value="data.actionElSelector"
        :label="t('workflow.blocks.base.selector')"
        placeholder="CSS Selector or XPath"
        class="mt-2 w-full"
        @change="updateData({ actionElSelector: $event })"
      />
      <ui-input
        v-if="['click-element', 'scroll'].includes(data.loadMoreAction)"
        :model-value="data.actionElMaxWaitTime"
        label="Max seconds wait for more elements"
        class="w-full mt-2"
        placeholder="0"
        type="number"
        @change="updateData({ actionElMaxWaitTime: +$event })"
      />
      <ui-checkbox
        v-if="data.loadMoreAction === 'scroll'"
        :model-value="data.scrollToBottom"
        class="mt-4"
        @change="updateData({ scrollToBottom: $event })"
      >
        {{ t('workflow.blocks.loop-elements.scrollToBottom') }}
      </ui-checkbox>
      <ui-input
        v-if="data.loadMoreAction === 'click-link'"
        :model-value="data.actionPageMaxWaitTime"
        label="Max seconds wait for the page to load"
        class="w-full mt-2"
        placeholder="0"
        type="number"
        @change="updateData({ actionPageMaxWaitTime: +$event })"
      />
    </div>
  </edit-interaction-base>
</template>
<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid/non-secure';
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const actions = ['none', 'click-element', 'click-link', 'scroll'];

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateLoopId(id) {
  let loopId = id.replace(/\s/g, '');

  if (!loopId) {
    loopId = nanoid(6);
  }

  updateData({ loopId });
}

onMounted(() => {
  if (!props.data.loopId) {
    updateData({ loopId: nanoid(6) });
  }
});
</script>
