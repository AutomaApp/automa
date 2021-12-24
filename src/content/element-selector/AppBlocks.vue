<template>
  <div class="events mt-4">
    <div class="flex items-center">
      <ui-select
        v-model="state.selectedBlock"
        class="flex-1 mr-4"
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
    <shared-codemirror
      v-if="state.blockResult"
      v-model="state.blockResult"
      :line-numbers="false"
      readonly
      lang="json"
      class="h-full mt-2"
    />
  </div>
</template>
<script setup>
import { shallowReactive } from 'vue';
import { tasks } from '@/utils/shared';
import handleForms from '../blocks-handler/handler-forms';
import handleGetText from '../blocks-handler/handler-get-text';
import handleEventClick from '../blocks-handler/handler-event-click';
import handelTriggerEvent from '../blocks-handler/handler-trigger-event';
import handleElementScroll from '../blocks-handler/handler-element-scroll';
import EditForms from '@/components/newtab/workflow/edit/EditForms.vue';
import SharedCodemirror from '@/components/newtab/shared/SharedCodemirror.vue';
import EditTriggerEvent from '@/components/newtab/workflow/edit/EditTriggerEvent.vue';
import EditScrollElement from '@/components/newtab/workflow/edit/EditScrollElement.vue';

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
