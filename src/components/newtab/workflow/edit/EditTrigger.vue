<template>
  <ui-textarea
    :model-value="data.description"
    autoresize
    placeholder="Description"
    class="w-full mb-2"
    @change="updateData({ description: $event })"
  />
  <ui-select
    :model-value="data.type || 'manual'"
    placeholder="Trigger workflow"
    class="w-full"
    @change="updateData({ type: $event })"
  >
    <option value="manual">Manual</option>
    <option value="interval">Interval</option>
    <option value="date">Date</option>
  </ui-select>
  <transition-expand mode="out-in">
    <div v-if="data.type === 'interval'" class="flex items-center mt-1">
      <ui-input
        :model-value="data.interval || '60'"
        type="number"
        class="w-full mr-2"
        label="Interval (minutes)"
        placeholder="5-120"
        min="5"
        max="120"
        @change="
          updateIntervalInput($event, { key: 'interval', min: 5, max: 120 })
        "
      />
      <ui-input
        :model-value="data.delay || '5'"
        type="number"
        class="w-full"
        label="Delay (minutes)"
        min="0"
        max="20"
        placeholder="0-20"
        @change="updateIntervalInput($event, { key: 'delay', min: 0, max: 20 })"
      />
    </div>
    <div v-else-if="data.type === 'date'" class="mt-2">
      <ui-input
        :model-value="data.date || minDate"
        :max="maxDate"
        :min="minDate"
        class="w-full"
        type="date"
        placeholder="Date"
        @change="updateDate"
      />
      <ui-input
        :model-value="data.time || '00:00'"
        type="time"
        class="w-full mt-2"
        placeholder="Time"
        @change="updateData({ time: $event || '00:00' })"
      />
    </div>
  </transition-expand>
</template>
<script setup>
import dayjs from 'dayjs';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
const minDate = dayjs().format('YYYY-MM-DD');

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateIntervalInput(value, { key, min, max }) {
  let num = +value;

  if (num < min) num = min;
  else if (num > max) num = max;

  updateData({ [key]: num });
}
function updateDate(value) {
  if (!value) return;

  let date = value;

  if (dayjs(minDate).isAfter(value)) date = minDate;
  else if (dayjs(maxDate).isBefore(value)) date = maxDate;

  updateData({ date });
}
</script>
