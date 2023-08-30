<template>
  <div>
    <div class="flex items-center">
      <p class="flex-1">{{ t('workflow.events.description') }}</p>
      <ui-button variant="accent" @click="updateModalState({ show: true })">
        {{ t('workflow.events.add-action') }}
      </ui-button>
    </div>
    <ui-list class="mt-4 space-y-1">
      <ui-list-item
        v-for="action in settings.events"
        :key="action.id"
        class="gap-2 group"
      >
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">{{ action.name || 'Untitled action' }}</p>
          <div
            v-for="event in action.events"
            :key="event"
            :class="[
              WORKFLOW_EVENTS_CLASSES[event],
              'border rounded-md px-2 py-1 text-xs inline-flex items-center mr-0.5',
            ]"
          >
            {{ t(`workflow.events.types.${event}.name`) }}
          </div>
        </div>
        <v-remixicon
          name="riPencilLine"
          class="group-hover:visible invisible cursor-pointer"
          @click="
            Object.assign(actionModal, {
              show: true,
              type: 'edit',
              data: cloneDeep(action),
            })
          "
        />
        <v-remixicon
          name="riDeleteBin7Line"
          class="group-hover:visible invisible cursor-pointer text-red-500 dark:text-red-400"
          @click="
            emit('update', {
              key: 'events',
              value: settings.events.filter((item) => item.id !== action.id),
            })
          "
        />
      </ui-list-item>
    </ui-list>
    <ui-modal
      v-model="actionModal.show"
      persist
      :title="t('workflow.events.add-action')"
      content-class="max-w-xl"
      @close="updateModalState({})"
    >
      <ui-input
        v-model="actionModal.data.name"
        :label="t('common.name')"
        placeholder="Untitled"
        autofocus
        class="w-full"
      />
      <p class="mt-4">{{ t('workflow.events.event', 2) }}</p>
      <div class="mt-1 flex flex-wrap items-center space-x-2">
        <div
          v-for="(event, index) in actionModal.data.events"
          :key="event"
          :class="[
            WORKFLOW_EVENTS_CLASSES[event],
            'border rounded-lg px-3 text-sm h-8 inline-flex items-center',
          ]"
        >
          <p class="flex-1">{{ t(`workflow.events.types.${event}.name`) }}</p>
          <v-remixicon
            name="riCloseLine"
            height="20"
            width="20"
            class="text-gray-200 dark:text-gray-600 ml-1 -mr-1 cursor-pointer"
            @click="actionModal.data.events.splice(index, 1)"
          />
        </div>
        <ui-popover
          v-if="WORKFLOW_EVENTS.length !== actionModal.data.events.length"
        >
          <template #trigger>
            <ui-button class="!h-8 !px-3">
              <v-remixicon
                name="riAddLine"
                class="-ml-1 mr-2"
                height="20"
                width="20"
              />
              <p class="text-sm">{{ t('common.add') }}</p>
            </ui-button>
          </template>
          <ui-list>
            <ui-list-item
              v-for="event in WORKFLOW_EVENTS.filter(
                (item) => !actionModal.data.events.includes(item)
              )"
              :key="event"
              small
              class="cursor-pointer !items-stretch"
              @click="actionModal.data.events.push(event)"
            >
              <div
                :class="[
                  WORKFLOW_EVENTS_CLASSES[event],
                  'w-2 flex-shrink-0 rounded-full',
                ]"
              ></div>
              <div class="text-sm ml-2">
                <p>{{ t(`workflow.events.types.${event}.name`) }}</p>
                <p class="text-gray-600 dark:text-gray-300 leading-tight">
                  {{ t(`workflow.events.types.${event}.description`) }}
                </p>
              </div>
            </ui-list-item>
          </ui-list>
        </ui-popover>
      </div>
      <p class="mt-4">{{ t('workflow.events.action') }}</p>
      <ui-select
        :model-value="actionModal.data.action.type"
        class="mt-1 w-full"
        @change="actionModal.data.action = EVENT_ACTIONS[$event]"
      >
        <option
          v-for="action in Object.keys(EVENT_ACTIONS)"
          :key="action"
          :value="action"
        >
          {{ t(`workflow.events.actions.${action}.title`) }}
        </option>
      </ui-select>
      <div class="mt-2">
        <component
          :is="EVENT_ACTIONS_COMP[actionModal.data.action.type]"
          :data="actionModal.data.action"
          @update:data="Object.assign(actionModal.data.action, $event)"
        />
      </div>
      <div class="mt-6 flex justify-end space-x-4">
        <ui-button @click="actionModal.show = false">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button
          :disabled="actionModal.data.events.length === 0"
          variant="accent"
          class="min-w-[90px]"
          @click="upsertAction"
        >
          {{
            actionModal.type === 'edit' ? t('common.update') : t('common.add')
          }}
        </ui-button>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import cloneDeep from 'lodash.clonedeep';
import EventCodeHTTP from './event/EventCodeHTTP.vue';
import EventCodeAction from './event/EventCodeAction.vue';

const props = defineProps({
  settings: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

const EVENT_ACTIONS = {
  'http-request': {
    type: 'http-request',
    url: '',
    body: '{\n\t"workflowStatus": {{workflow.status}},\n\t"workflowLogs": {{workflow.logs}},\n\t"errorMessage": {{workflow.errorMessage}}\n}',
    headers: [],
    method: 'POST',
  },
  'js-code': {
    code: "const workflow = automaRefData('workflow');\nconsole.log(\n\tworkflow.status,\n\tworkflow.logs,\n\tworkflow.errorMessage\n)",
    type: 'js-code',
  },
};
const EVENT_ACTIONS_COMP = {
  'js-code': EventCodeAction,
  'http-request': EventCodeHTTP,
};
const WORKFLOW_EVENTS_CLASSES = {
  'finish:success': 'bg-green-300 dark:text-black dark:bg-green-200',
  'finish:failed': 'bg-red-300 dark:text-black dark:bg-red-200',
};
const WORKFLOW_EVENTS = ['finish:success', 'finish:failed'];

const defaultActionModal = {
  type: 'add',
  show: false,
  data: {
    name: '',
    events: [],
    action: EVENT_ACTIONS['http-request'],
  },
};

const actionModal = reactive({ ...cloneDeep(defaultActionModal) });

function updateModalState(detail) {
  Object.assign(actionModal, { ...cloneDeep(defaultActionModal), ...detail });
}
function upsertAction() {
  let copyEvents = [...(props.settings.events ?? [])];

  if (actionModal.type === 'add') {
    copyEvents.push({
      id: nanoid(),
      ...actionModal.data,
      name: actionModal.data.name || 'Untitled action',
    });
  } else {
    copyEvents = copyEvents.map((event) => {
      if (event.id !== actionModal.data.id) return event;

      return actionModal.data;
    });
  }

  updateModalState({ show: false });

  emit('update', { key: 'events', value: copyEvents });
}
</script>
