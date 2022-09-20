<template>
  <div class="trigger">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <!-- <ui-select
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
          :is="triggers[data.type]?.component"
          :data="data"
          @update="updateData"
        />
      </keep-alive>
    </transition-expand> -->
    <ui-button
      variant="accent"
      class="w-full mt-4"
      @click="state.showTriggersModal = true"
    >
      Edit Triggers
    </ui-button>
    <ui-button class="mt-4" @click="state.showParamModal = true">
      <v-remixicon name="riCommandLine" class="mr-2 -ml-1" />
      <span>Parameters</span>
    </ui-button>
    <ui-modal
      v-model="state.showParamModal"
      title="Parameters"
      content-class="max-w-4xl"
    >
      <edit-workflow-parameters
        :data="data.parameters"
        @update="updateData({ parameters: $event })"
      />
    </ui-modal>
    <ui-modal
      v-model="state.showTriggersModal"
      title="Workflow Triggers"
      content-class="max-w-2xl"
    >
      <div
        class="overflow-auto scroll"
        style="min-height: 350px; max-height: calc(100vh - 14rem)"
      >
        <ui-expand
          v-for="(trigger, index) in state.triggers"
          :key="index"
          class="border rounded-lg mb-2 trigger-item"
        >
          <template #header>
            <p class="flex-1">
              {{ t(`workflow.blocks.trigger.items.${trigger.type}`) }}
            </p>
            <v-remixicon
              name="riDeleteBin7Line"
              size="20"
              class="delete-btn cursor-pointer"
              @click.stop="state.triggers.splice(index, 1)"
            />
          </template>
          <div class="px-4 py-2">
            <component
              :is="triggers[trigger.type]?.component"
              :data="trigger.data"
              @update="updateTriggerData(index, $event)"
            />
          </div>
        </ui-expand>
        <ui-popover class="mt-4">
          <template #trigger>
            <ui-button>
              Add trigger
              <hr class="h-4 border-r" />
              <v-remixicon
                name="riArrowLeftSLine"
                class="ml-2 -mr-1"
                rotate="-90"
              />
            </ui-button>
          </template>
          <ui-list class="space-y-1">
            <ui-list-item
              v-for="(_, trigger) in triggers"
              :key="trigger"
              v-close-popover
              :value="trigger"
              class="cursor-pointer"
              small
              @click="addTrigger(trigger)"
            >
              {{ t(`workflow.blocks.trigger.items.${trigger}`) }}
            </ui-list-item>
          </ui-list>
        </ui-popover>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid/non-secure';
import cloneDeep from 'lodash.clonedeep';
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
  // 'element-change': TriggerElementChange,
  interval: {
    component: TriggerInterval,
    data: {
      interval: 60,
      delay: 5,
      fixedDelay: false,
    },
  },
  'context-menu': {
    onlyOne: true,
    component: TriggerContextMenu,
    data: {
      contextMenuName: '',
      contextTypes: [],
    },
  },
  date: {
    component: TriggerDate,
    data: {
      date: '',
    },
  },
  'specific-day': {
    component: TriggerSpecificDay,
    data: {
      days: [],
      time: '00:00',
    },
  },
  'on-startup': {
    onlyOne: true,
    component: null,
    data: null,
  },
  'visit-web': {
    component: TriggerVisitWeb,
    data: {
      url: '',
      isUrlRegex: false,
    },
  },
  'keyboard-shortcut': {
    component: TriggerKeyboardShortcut,
    data: {
      shortcut: '',
    },
  },
};

const { t } = useI18n();

const state = reactive({
  showParamModal: false,
  showTriggersModal: false,
  triggers: [...(props.data?.triggers || [])],
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addTrigger(type) {
  if (triggers[type].onlyOne) {
    const trigerExists = state.triggers.some(
      (trigger) => trigger.type === type
    );
    if (trigerExists) return;
  }

  state.triggers.push({
    id: nanoid(5),
    type,
    data: cloneDeep(triggers[type].data),
  });
}
function updateTriggerData(index, data) {
  Object.assign(state.triggers[index].data, data);
}

watch(
  () => state.triggers,
  (newData) => {
    updateData({ triggers: newData });
  },
  { deep: true }
);

onMounted(() => {
  if (props.data.triggers) return;

  state.triggers = [
    { type: props.data.type, data: { ...props.data }, id: nanoid(5) },
  ];
});
</script>
<style>
.trigger-item > button {
  @apply focus:ring-0;
  text-align: left;
  .delete-btn {
    visibility: hidden;
  }
  &:hover .delete-btn {
    visibility: visible;
  }
}
</style>
