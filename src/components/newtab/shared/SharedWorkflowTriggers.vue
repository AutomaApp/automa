<template>
  <div
    class="overflow-auto scroll"
    style="min-height: 350px; max-height: calc(100vh - 14rem)"
  >
    <ui-expand
      v-for="(trigger, index) in triggersList"
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
          @click.stop="triggersList.splice(index, 1)"
        />
      </template>
      <div class="px-4 py-2">
        <component
          :is="triggersData[trigger.type]?.component"
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
          v-for="triggerType in triggersTypes"
          :key="triggerType"
          v-close-popover
          class="cursor-pointer"
          small
          @click="addTrigger(triggerType)"
        >
          {{ t(`workflow.blocks.trigger.items.${triggerType}`) }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid/non-secure';
import cloneDeep from 'lodash.clonedeep';
import TriggerDate from '../workflow/edit/Trigger/TriggerDate.vue';
import TriggerCronJob from '../workflow/edit/Trigger/TriggerCronJob.vue';
import TriggerInterval from '../workflow/edit/Trigger/TriggerInterval.vue';
import TriggerVisitWeb from '../workflow/edit/Trigger/TriggerVisitWeb.vue';
import TriggerContextMenu from '../workflow/edit/Trigger/TriggerContextMenu.vue';
import TriggerSpecificDay from '../workflow/edit/Trigger/TriggerSpecificDay.vue';
// import TriggerElementChange from '../workflow/edit/Trigger/TriggerElementChange.vue';
import TriggerKeyboardShortcut from '../workflow/edit/Trigger/TriggerKeyboardShortcut.vue';

const props = defineProps({
  triggers: {
    type: Array,
    default: () => [],
  },
  exclude: {
    type: Array,
    default: null,
  },
});
const emit = defineEmits(['update:triggers', 'update']);

const triggersData = {
  // 'element-change': TriggerElementChange,
  interval: {
    component: TriggerInterval,
    data: {
      interval: 60,
      delay: 5,
      fixedDelay: false,
    },
  },
  'cron-job': {
    component: TriggerCronJob,
    data: {
      expression: '',
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
      supportSPA: false,
    },
  },
  'keyboard-shortcut': {
    component: TriggerKeyboardShortcut,
    data: {
      shortcut: '',
    },
  },
};

const triggersTypes = props.exclude
  ? Object.keys(triggersData).filter((type) => !props.exclude.includes(type))
  : Object.keys(triggersData);

const { t } = useI18n();
const triggersList = ref([...(props.triggers || [])]);

function addTrigger(type) {
  if (triggersData[type].onlyOne) {
    const trigerExists = triggersList.value.some(
      (trigger) => trigger.type === type
    );
    if (trigerExists) return;
  }

  triggersList.value.push({
    id: nanoid(5),
    type,
    data: cloneDeep(triggersData[type].data),
  });
}
function updateTriggerData(index, data) {
  Object.assign(triggersList.value[index].data, data);
}

watch(
  triggersList,
  (newData) => {
    emit('update', newData);
    emit('update:triggers', newData);
  },
  { deep: true }
);
</script>
