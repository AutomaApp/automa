<template>
  <ui-input
    :model-value="data.expression"
    :label="t('workflow.blocks.trigger.forms.cron-expression')"
    class="w-full -mt-2"
    placeholder="0 15 10 ? * *"
    @change="updateCronExpression($event, true)"
  />
  <p
    class="ml-1 leading-tight mt-1"
    :class="{ 'text-red-400 dark:text-red-500': state.isError }"
  >
    {{ state.nextSchedule }}
  </p>
</template>
<script setup>
import { shallowReactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import cronParser from 'cron-parser';
import { debounce } from '@/utils/helper';
import { readableCron } from '@/lib/cronstrue';
import dayjs from '@/lib/dayjs';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

const state = shallowReactive({
  isError: false,
  readableCron: '',
  nextSchedule: '',
});

const updateCronExpression = debounce((expression, update = false) => {
  try {
    const cronExpression = cronParser.parseExpression(expression);

    state.isError = false;
    state.nextSchedule = `${readableCron(expression)} - ${t(
      'scheduledWorkflow.nextRun'
    )}: ${dayjs(cronExpression.next()).format('DD MMM YYYY, HH:mm:ss')}`;

    if (update) emit('update', { expression });
  } catch (error) {
    state.isError = true;
    state.nextSchedule = error.message;
  }
}, 100);

onMounted(() => {
  updateCronExpression(props.data.expression);
});
</script>
