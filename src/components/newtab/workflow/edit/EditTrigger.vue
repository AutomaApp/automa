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
      <div v-else-if="data.type === 'specific-day'" class="mt-4">
        <ui-popover
          :options="{ animation: null }"
          trigger-width
          class="w-full mb-2"
          trigger-class="w-full"
        >
          <template #trigger>
            <ui-button class="w-full">
              <p class="text-left flex-1 text-overflow mr-2">
                {{
                  tempDate.days.length === 0
                    ? t('workflow.blocks.trigger.selectDay')
                    : getDaysText(tempDate.days)
                }}
              </p>
              <v-remixicon
                size="28"
                name="riArrowDropDownLine"
                class="text-gray-600 dark:text-gray-200 -mr-2"
              />
            </ui-button>
          </template>
          <div class="grid gap-2 grid-cols-2">
            <ui-checkbox
              v-for="(day, id) in days"
              :key="id"
              :model-value="data.days?.includes(id)"
              @change="onSelectDayChange($event, id)"
            >
              {{ t(`workflow.blocks.trigger.days.${id}`) }}
            </ui-checkbox>
          </div>
        </ui-popover>
        <div class="flex items-center">
          <ui-input v-model="tempDate.time" type="time" class="flex-1 mr-2" />
          <ui-button variant="accent" @click="addTime">
            {{ t('workflow.blocks.trigger.addTime') }}
          </ui-button>
        </div>
        <div class="my-2">
          <ui-expand
            v-for="(day, index) in sortedDaysArr"
            :key="day.id"
            header-class="focus:ring-0 flex items-center py-2 w-full group text-left"
            type="time"
            class="w-full"
          >
            <template #header>
              <p class="flex-1">
                {{ t(`workflow.blocks.trigger.days.${day.id}`) }}
              </p>
              <span class="text-gray-600 dark:text-gray-200">
                <v-remixicon
                  name="riDeleteBin7Line"
                  class="mr-1 group invisible group-hover:visible inline-block"
                  @click="daysArr.splice(index, 1)"
                />
                {{ day.times.length }}x
              </span>
            </template>
            <div class="grid grid-cols-2 gap-1 mb-1">
              <div
                v-for="(time, timeIndex) in day.times"
                :key="time"
                class="flex items-center px-4 py-2 border rounded-lg group"
              >
                <span class="flex-1"> {{ formatTime(time) }} </span>
                <v-remixicon
                  name="riDeleteBin7Line"
                  class="cursor-pointer"
                  @click="removeDayTime(index, timeIndex)"
                />
              </div>
            </div>
          </ui-expand>
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
            v-tooltip="
              t(
                `workflow.blocks.trigger.shortcut.${
                  recordKeys.isRecording ? 'stopRecord' : 'tooltip'
                }`
              )
            "
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
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import dayjs from 'dayjs';
import { isObject } from '@/utils/helper';
import recordShortcut from '@/utils/record-shortcut';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const toast = useToast();

const triggers = [
  'manual',
  'interval',
  'date',
  'specific-day',
  'on-startup',
  'visit-web',
  'keyboard-shortcut',
];
const days = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
const minDate = dayjs().format('YYYY-MM-DD');

const recordKeys = reactive({
  isRecording: false,
  keys: props.data.shortcut,
});
const tempDate = reactive({
  days: [],
  time: '00:00',
});
const daysArr = ref(null);

const sortedDaysArr = computed(() =>
  daysArr.value ? daysArr.value.slice().sort((a, b) => a.id - b.id) : []
);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function getDaysText(dayIds) {
  return dayIds
    .map((day) => t(`workflow.blocks.trigger.days.${day}`))
    .join(', ');
}
function formatTime(time) {
  const [hour, minute] = time.split(':');

  return dayjs().hour(hour).minute(minute).format('hh:mm A');
}
function removeDayTime(index, timeIndex) {
  daysArr.value[index].times.splice(timeIndex, 1);

  if (daysArr.value[index].times.length === 0) {
    daysArr.value.splice(index, 1);
  }
}
function onSelectDayChange(value, id) {
  if (value) tempDate.days.push(+id);
  else tempDate.days.splice(tempDate.days.indexOf(+id), 1);
}
function addTime() {
  tempDate.days.forEach((dayId) => {
    const dayIndex = daysArr.value.findIndex(({ id }) => id === dayId);

    if (dayIndex === -1) {
      daysArr.value.push({
        id: dayId,
        times: [tempDate.time],
      });
    } else {
      const isTimeExist = daysArr.value[dayIndex].times.includes(tempDate.time);

      if (isTimeExist) {
        const message = t('workflow.blocks.trigger.timeExist', {
          time: formatTime(tempDate.time),
          day: t(`workflow.blocks.trigger.days.${dayId}`),
        });

        toast.error(message);

        return;
      }

      daysArr.value[dayIndex].times.push(tempDate.time);
    }
  });
}
function handleKeydownEvent(event) {
  recordShortcut(event, (keys) => {
    recordKeys.keys = keys.join('+');
    updateData({ shortcut: recordKeys.keys });
  });
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

watch(
  daysArr,
  (value, oldValue) => {
    if (!oldValue) return;

    updateData({ days: value });
  },
  { deep: true }
);

onMounted(() => {
  const isStringDay =
    props.data.days.length > 0 && !isObject(props.data.days[0]);
  daysArr.value = isStringDay
    ? props.data.days.map((day) => ({ id: day, times: [props.data.time] }))
    : props.data.days;
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydownEvent);
});
</script>
