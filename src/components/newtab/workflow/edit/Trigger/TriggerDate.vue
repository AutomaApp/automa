<template>
  <div>
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
      step="1"
      class="mt-2 w-full"
      @change="$emit('update', { time: $event || '00:00' })"
    />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import dayjs from '@/lib/dayjs';

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();
const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
const minDate = dayjs().format('YYYY-MM-DD');

function updateDate(value) {
  if (!value) return;

  let date = value?.date ?? minDate;

  if (dayjs(minDate).isAfter(date)) date = minDate;
  else if (dayjs(maxDate).isBefore(date)) date = maxDate;

  emit('update', { date });
}
</script>
