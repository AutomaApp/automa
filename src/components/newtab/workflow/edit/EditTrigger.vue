<template>
  <div class="trigger">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.type || 'manual'"
      :placeholder="t('workflow.blocks.trigger.forms.triggerWorkflow')"
      class="w-full"
      @change="updateData({ type: $event })"
    >
      <option v-for="(_, trigger) in triggers" :key="trigger" :value="trigger">
        {{ t(`workflow.blocks.trigger.items.${trigger}`) }}
      </option>
    </ui-select>
    <transition-expand mode="out-in">
      <keep-alive>
        <component
          :is="triggers[data.type]"
          :data="data"
          @update="updateData"
        />
      </keep-alive>
    </transition-expand>
    <ui-button class="mt-4" @click="state.showModal = true">
      <v-remixicon name="riCommandLine" class="mr-2 -ml-1" />
      <span>Parameters</span>
    </ui-button>
    <ui-modal
      v-model="state.showModal"
      title="Parameters"
      content-class="max-w-2xl"
    >
      <ul
        class="space-y-2 mt-2 pb-1 overflow-auto scroll"
        style="max-height: calc(100vh - 15rem)"
      >
        <li
          v-for="(param, index) in state.parameters"
          :key="index"
          class="flex items-end space-x-2"
        >
          <ui-input
            v-model="param.name"
            label="Name"
            placeholder="Parameter name"
          />
          <ui-select v-model="param.type" label="Type">
            <option v-for="type in paramTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </ui-select>
          <ui-input
            v-model="param.placeholder"
            label="Placeholder (optional)"
            placeholder="A parameter"
          />
          <ui-button icon @click="state.parameters.splice(index, 1)">
            <v-remixicon name="riDeleteBin7Line" />
          </ui-button>
        </li>
      </ul>
      <ui-button variant="accent" class="mt-4" @click="addParameter">
        Add parameter
      </ui-button>
    </ui-modal>
  </div>
</template>
<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import cloneDeep from 'lodash.clonedeep';
import TriggerDate from './Trigger/TriggerDate.vue';
import TriggerInterval from './Trigger/TriggerInterval.vue';
import TriggerVisitWeb from './Trigger/TriggerVisitWeb.vue';
import TriggerContextMenu from './Trigger/TriggerContextMenu.vue';
import TriggerSpecificDay from './Trigger/TriggerSpecificDay.vue';
// import TriggerElementChange from './Trigger/TriggerElementChange.vue';
import TriggerKeyboardShortcut from './Trigger/TriggerKeyboardShortcut.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const triggers = {
  manual: null,
  interval: TriggerInterval,
  'context-menu': TriggerContextMenu,
  // 'element-change': TriggerElementChange,
  date: TriggerDate,
  'specific-day': TriggerSpecificDay,
  'on-startup': null,
  'visit-web': TriggerVisitWeb,
  'keyboard-shortcut': TriggerKeyboardShortcut,
};
const paramTypes = [
  { id: 'string', name: 'String' },
  { id: 'number', name: 'Number' },
];

const { t } = useI18n();

const state = reactive({
  showModal: false,
  parameters: cloneDeep(props.data.parameters || []),
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addParameter() {
  state.parameters.push({
    name: 'param',
    type: 'string',
    placeholder: 'Text',
  });
}

watch(
  () => state.parameters,
  (parameters) => {
    updateData({ parameters });
  },
  { deep: true }
);
</script>
