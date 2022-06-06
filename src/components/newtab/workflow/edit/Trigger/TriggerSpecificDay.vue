<template>
  <div class="mt-4">
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
</template>
<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import dayjs from '@/lib/dayjs';
import { isObject } from '@/utils/helper';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const days = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const { t } = useI18n();
const toast = useToast();

const daysArr = ref(null);
const tempDate = reactive({
  days: [],
  time: '00:00',
});

const sortedDaysArr = computed(() =>
  daysArr.value ? daysArr.value.slice().sort((a, b) => a.id - b.id) : []
);

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
function onSelectDayChange(value, id) {
  if (value) tempDate.days.push(+id);
  else tempDate.days.splice(tempDate.days.indexOf(+id), 1);
}
function getDaysText(dayIds) {
  return dayIds
    .map((day) => t(`workflow.blocks.trigger.days.${day}`))
    .join(', ');
}

watch(
  daysArr,
  (value, oldValue) => {
    if (!oldValue) return;

    emit('update', { days: value });
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
</script>
