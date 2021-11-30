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
      @change="handleSelectChange"
    >
      <option v-for="trigger in triggers" :key="trigger" :value="trigger">
        {{ t(`workflow.blocks.trigger.items.${trigger}`) }}
      </option>
    </ui-select>
    <transition-expand mode="out-in">
      <div v-if="data.type === 'interval'" class="flex items-center mt-1">
        <ui-input
          :model-value="data.interval"
          :label="t('workflow.blocks.trigger.forms.interval')"
          type="number"
          class="w-full mr-2"
          placeholder="1-120"
          min="1"
          max="120"
          @change="
            updateIntervalInput($event, { key: 'interval', min: 1, max: 120 })
          "
        />
        <ui-input
          :model-value="data.delay"
          type="number"
          class="w-full"
          :label="t('workflow.blocks.trigger.forms.delay')"
          min="0"
          max="20"
          placeholder="0-20"
          @change="
            updateIntervalInput($event, { key: 'delay', min: 0, max: 20 })
          "
        />
      </div>
      <div v-else-if="data.type === 'date'" class="mt-2">
        <ui-input
          :model-value="data.date"
          :max="maxDate"
          :min="minDate"
          :placeholder="t('workflow.blocks.trigger.forms.date')"
          class="w-full"
          type="date"
          @change="updateDate({ date: $event })"
        />
        <ui-input
          :model-value="data.time"
          :placeholder="t('workflow.blocks.trigger.forms.time')"
          type="time"
          class="w-full mt-2"
          @change="updateData({ time: $event || '00:00' })"
        />
      </div>
      <div v-else-if="data.type === 'specific-day'" class="mt-2">
        <ui-input
          :model-value="data.time"
          type="time"
          class="w-full my-2"
          placeholder="Time"
          @change="updateData({ time: $event || '00:00' })"
        />
        <div class="grid gap-2 grid-cols-2">
          <ui-checkbox
            v-for="day in days"
            :key="day.id"
            :model-value="data.days?.includes(day.id)"
            @change="onDayChange($event, day.id)"
          >
            {{ t(`workflow.blocks.trigger.days.${day.id}`) }}
          </ui-checkbox>
        </div>
      </div>
      <div v-else-if="data.type === 'visit-web'" class="mt-2">
        <ui-input
          :model-value="data.url"
          :placeholder="t('workflow.blocks.trigger.forms.url')"
          class="w-full"
          @change="updateData({ url: $event })"
        />
        <ui-checkbox
          :model-value="data.isUrlRegex"
          class="mt-1"
          @change="updateData({ isUrlRegex: $event })"
        >
          {{ t('workflow.blocks.trigger.useRegex') }}
        </ui-checkbox>
      </div>
      <div v-else-if="data.type === 'keyboard-shortcut'" class="mt-2">
        <div class="flex items-center mb-2">
          <ui-input
            :model-value="recordKeys.keys"
            readonly
            class="flex-1 mr-2"
            :placeholder="t('workflow.blocks.trigger.forms.shortcut')"
          />
          <ui-button
            v-tooltip="t('workflow.blocks.trigger.shortcut.tooltip')"
            icon
            @click="toggleRecordKeys"
          >
            <v-remixicon
              :name="
                recordKeys.isRecording ? 'riStopLine' : 'riRecordCircleLine'
              "
            />
          </ui-button>
        </div>
        <ui-checkbox
          :model-value="data.activeInInput"
          class="mb-1"
          :title="t('workflow.blocks.trigger.shortcut.checkboxTitle')"
          @change="updateData({ activeInInput: $event })"
        >
          {{ t('workflow.blocks.trigger.shortcut.checkbox') }}
        </ui-checkbox>
        <p class="mt-4 leading-tight text-gray-600 dark:text-gray-200">
          {{ t('workflow.blocks.trigger.shortcut.note') }}
        </p>
      </div>
    </transition-expand>
  </div>
</template>
<script setup>
import { shallowReactive, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const triggers = [
  'manual',
  'interval',
  'date',
  'specific-day',
  'visit-web',
  'keyboard-shortcut',
];
const days = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];
const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
const minDate = dayjs().format('YYYY-MM-DD');
const allowedKeys = {
  '+': 'plus',
  Delete: 'del',
  Insert: 'ins',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowUp: 'up',
  ArrowRight: 'right',
  Escape: 'escape',
  Enter: 'enter',
};

const recordKeys = shallowReactive({
  isRecording: false,
  keys: props.data.shortcut,
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function onDayChange(value, id) {
  const dataDays = [...(props.data?.days || [])];

  if (value) dataDays.push(id);
  else dataDays.splice(dataDays.indexOf(id), 1);

  updateData({ days: dataDays.sort() });
}
function handleKeydownEvent(event) {
  event.preventDefault();
  event.stopPropagation();

  if (event.repeat) return;

  const keys = [];
  const { ctrlKey, altKey, metaKey, shiftKey, key } = event;

  if (ctrlKey || metaKey) keys.push('mod');
  if (altKey) keys.push('alt');
  if (shiftKey) keys.push('shift');

  const isValidKey = !!allowedKeys[key] || /^[a-z0-9,./;'[\]\-=`]$/i.test(key);

  if (isValidKey) {
    keys.push(allowedKeys[key] || key.toLowerCase());

    recordKeys.keys = keys.join('+');
    updateData({ shortcut: recordKeys.keys });
  }
}
function toggleRecordKeys() {
  if (recordKeys.isRecording) {
    window.removeEventListener('keydown', handleKeydownEvent);
  } else {
    window.addEventListener('keydown', handleKeydownEvent);
  }

  recordKeys.isRecording = !recordKeys.isRecording;
}
function handleSelectChange(type) {
  if (recordKeys.isRecording) {
    window.removeEventListener('keydown', handleKeydownEvent);
    recordKeys.isRecording = false;
  }

  updateData({ type });
}
function updateIntervalInput(value, { key, min, max }) {
  let num = +value;

  if (num < min) num = min;
  else if (num > max) num = max;

  updateData({ [key]: num });
}
function updateDate(value) {
  if (!value) return;

  let date = value?.date ?? minDate;

  if (dayjs(minDate).isAfter(date)) date = minDate;
  else if (dayjs(maxDate).isBefore(date)) date = maxDate;

  updateData({ date });
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydownEvent);
});
</script>
