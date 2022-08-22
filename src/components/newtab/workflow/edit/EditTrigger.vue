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
    <ui-button class="mt-4" @click="showModal = true">
      <v-remixicon name="riCommandLine" class="mr-2 -ml-1" />
      <span>Parameters</span>
    </ui-button>
    <ui-modal v-model="showModal" title="Parameters" content-class="max-w-4xl">
      <edit-workflow-parameters
        :data="data.parameters"
        @update="updateData({ parameters: $event })"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import TriggerDate from './Trigger/TriggerDate.vue';
import TriggerInterval from './Trigger/TriggerInterval.vue';
import TriggerVisitWeb from './Trigger/TriggerVisitWeb.vue';
import TriggerContextMenu from './Trigger/TriggerContextMenu.vue';
import TriggerSpecificDay from './Trigger/TriggerSpecificDay.vue';
// import TriggerElementChange from './Trigger/TriggerElementChange.vue';
import TriggerKeyboardShortcut from './Trigger/TriggerKeyboardShortcut.vue';
import EditWorkflowParameters from './EditWorkflowParameters.vue';

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

const { t } = useI18n();

const showModal = shallowRef(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
