<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-select
      :model-value="data.eventName"
      class="w-full mt-2"
      placeholder="Select event"
      @change="handleEventChange"
    >
      <option v-for="event in eventList" :key="event.id" :value="event.id">
        {{ event.name }}
      </option>
    </ui-select>
    <button
      v-if="componentName"
      class="mb-2 block w-full text-left mt-4 focus:ring-0"
      @click="showOptions = !showOptions"
    >
      <v-remixicon
        name="riArrowLeftSLine"
        class="mr-1 transition-transform align-middle inline-block -ml-1"
        :rotate="showOptions ? 270 : 180"
      />
      <span class="align-middle">Options</span>
    </button>
    <transition-expand>
      <div v-if="showOptions && componentName">
        <component
          :is="componentName"
          :params="params"
          @update="updateParams"
        />
      </div>
    </transition-expand>
  </edit-interaction-base>
</template>
<script>
import TriggerEventMouse from './TriggerEventMouse.vue';
import TriggerEventTouch from './TriggerEventTouch.vue';
import TriggerEventWheel from './TriggerEventWheel.vue';
import TriggerEventKeyboard from './TriggerEventKeyboard.vue';

export default {
  components: {
    TriggerEventMouse,
    TriggerEventWheel,
    TriggerEventTouch,
    TriggerEventKeyboard,
  },
};
</script>
<script setup>
/* eslint-disable */
import { ref } from 'vue';
import { eventList } from '@/utils/shared';
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const eventComponents = {
  'mouse-event': 'TriggerEventMouse',
  'focus-event': '',
  'touch-event': 'TriggerEventTouch',
  'keyboard-event': 'TriggerEventKeyboard',
  'wheel-event': 'TriggerEventWheel',
};

const componentName = ref(eventComponents[props.data.eventType]);
const params = ref(props.data.eventParams);
const showOptions = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateParams(value) {
  params.value = value;
  updateData({ eventParams: value });
}
function handleEventChange(value) {
  const eventType = eventList.find(({ id }) => id === value).type;
  const payload = { eventName: value, eventType };

  componentName.value = eventComponents[eventType];

  if (eventType !== props.eventType) {
    payload.eventParams = {};
    params.value = {};
  }

  updateData(payload);
}
</script>
