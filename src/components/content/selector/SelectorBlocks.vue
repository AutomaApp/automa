<template>
  <div class="events mt-4">
    <div class="flex items-center">
      <ui-select
        v-model="state.selectedBlock"
        class="mr-4 flex-1 p-0.5"
        placeholder="Select block"
        @change="onSelectChanged"
      >
        <option v-for="(block, id) in blocks" :key="id" :value="id">
          {{ block.name }}
        </option>
      </ui-select>
      <ui-button
        :disabled="!state.selectedBlock"
        variant="accent"
        @click="executeBlock"
      >
        Execute
      </ui-button>
    </div>
    <component
      :is="blocks[state.selectedBlock].component"
      v-if="state.selectedBlock && blocks[state.selectedBlock].component"
      :data="state.params"
      :hide-base="true"
      @update:data="updateParams"
    />
    <pre
      v-if="state.blockResult"
      class="mt-2 h-full overflow-auto rounded-lg bg-accent p-2 text-sm text-gray-100"
      >{{ state.blockResult }}</pre
    >
  </div>
</template>
<script setup>
import { shallowReactive } from 'vue';
import { tasks } from '@/utils/shared';
import EditForms from '@/components/newtab/workflow/edit/EditForms.vue';
import EditTriggerEvent from '@/components/newtab/workflow/edit/EditTriggerEvent.vue';
import EditScrollElement from '@/components/newtab/workflow/edit/EditScrollElement.vue';
import handleForms from '@/content/blocksHandler/handlerForms';
import handleGetText from '@/content/blocksHandler/handlerGetText';
import handleEventClick from '@/content/blocksHandler/handlerEventClick';
import handelTriggerEvent from '@/content/blocksHandler/handlerTriggerEvent';
import handleElementScroll from '@/content/blocksHandler/handlerElementScroll';

const props = defineProps({
  selector: {
    type: String,
    default: '',
  },
  elements: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update', 'execute']);

const blocks = {
  forms: {
    ...tasks.forms,
    component: EditForms,
    handler: handleForms,
  },
  'get-text': {
    ...tasks['get-text'],
    component: '',
    handler: handleGetText,
  },
  'event-click': {
    ...tasks['event-click'],
    component: '',
    handler: handleEventClick,
  },
  'trigger-event': {
    ...tasks['trigger-event'],
    component: EditTriggerEvent,
    handler: handelTriggerEvent,
  },
  'element-scroll': {
    ...tasks['element-scroll'],
    component: EditScrollElement,
    handler: handleElementScroll,
  },
};

const state = shallowReactive({
  params: {},
  blockResult: '',
  selectedBlock: '',
});

function updateParams(data = {}) {
  state.params = data;
  emit('update');
}
function onSelectChanged(value) {
  state.params = tasks[value].data;
  state.blockResult = '';
  emit('update');
}
function executeBlock() {
  const params = {
    ...state.params,
    selector: props.selector,
    multiple: props.elements.length > 1,
  };

  emit('execute', true);

  blocks[state.selectedBlock].handler({ data: params }).then((result) => {
    state.blockResult = JSON.stringify(result, null, 2).trim();
    emit('update');
    emit('execute', false);
  });
}
</script>
