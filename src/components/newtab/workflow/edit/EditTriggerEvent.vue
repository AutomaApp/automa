<template>
  <edit-interaction-base
    v-bind="{ data, autocomplete, hide: hideBase }"
    @change="updateData"
  >
    <ui-select
      :model-value="data.eventName"
      :placeholder="t('workflow.blocks.trigger-event.selectEvent')"
      class="w-full mt-4"
      @change="handleSelectChange"
    >
      <option v-for="event in eventList" :key="event.id" :value="event.id">
        {{ event.name }}
      </option>
    </ui-select>
    <button
      class="mb-2 block flex items-center w-full text-left mt-1 focus:ring-0"
      @click="showOptions = !showOptions"
    >
      <v-remixicon
        name="riArrowLeftSLine"
        class="mr-1 transition-transform -ml-1"
        :rotate="showOptions ? 270 : 180"
      />
      <span class="flex-1">{{ t('common.options') }}</span>
      <a
        v-if="data.eventName"
        :href="getEventDetailsUrl()"
        rel="noopener"
        target="_blank"
        @click.stop
      >
        <v-remixicon name="riInformationLine" size="20" />
      </a>
    </button>
    <transition-expand>
      <div v-if="showOptions">
        <div class="grid grid-cols-2 gap-2 mb-4">
          <ui-checkbox
            :model-value="params.bubbles"
            @change="updateParams({ ...params, bubbles: $event })"
          >
            Bubbles
          </ui-checkbox>
          <ui-checkbox
            :model-value="params.cancelable"
            @change="updateParams({ ...params, cancelable: $event })"
          >
            Cancelable
          </ui-checkbox>
        </div>
        <component
          :is="eventComponents[data.eventType]"
          v-if="eventComponents[data.eventType]"
          :key="data.eventName"
          :params="params"
          @update="updateParams({ ...params, ...$event })"
        />
      </div>
    </transition-expand>
  </edit-interaction-base>
</template>
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { eventList } from '@/utils/shared';
import { toCamelCase } from '@/utils/helper';
import EditInteractionBase from './EditInteractionBase.vue';
import TriggerEventMouse from './TriggerEventMouse.vue';
import TriggerEventTouch from './TriggerEventTouch.vue';
import TriggerEventWheel from './TriggerEventWheel.vue';
import TriggerEventInput from './TriggerEventInput.vue';
import TriggerEventKeyboard from './TriggerEventKeyboard.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  hideBase: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const eventComponents = {
  'mouse-event': TriggerEventMouse,
  'focus-event': '',
  event: '',
  'touch-event': TriggerEventTouch,
  'keyboard-event': TriggerEventKeyboard,
  'wheel-event': TriggerEventWheel,
  'input-event': TriggerEventInput,
};

const params = ref(props.data.eventParams);
const showOptions = ref(false);

function getEventDetailsUrl() {
  const eventType = toCamelCase(props.data.eventType);

  return `https://developer.mozilla.org/en-US/docs/Web/API/${eventType}/${eventType}`;
}
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateParams(value) {
  params.value = value;
  updateData({ eventParams: value });
}
function handleSelectChange(value) {
  const eventType = eventList.find(({ id }) => id === value).type;
  const payload = { eventName: value, eventType };

  if (eventType !== props.eventType) {
    const defaultParams = { bubbles: true, cancelable: true };

    payload.eventParams = defaultParams;
    params.value = defaultParams;
  }

  updateData(payload);
}
</script>
