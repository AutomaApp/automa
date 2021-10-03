<template>
  <edit-interaction-base v-bind="{ data }" @change="updateData">
    <ui-textarea
      :model-value="data.text"
      placeholder="Text"
      class="mt-3 w-full"
      @change="updateData({ text: $event })"
    />
    <ui-input
      :model-value="data.delay"
      label="Typing delay (0 to disable)"
      placeholder="Delay"
      class="w-full"
      min="0"
      type="number"
      @change="updateData({ delay: +$event })"
    />
    <div class="mt-3">
      <p>Trigger these event when input text:</p>
      <div class="grid grid-cols-2 gap-2 mt-2">
        <ui-checkbox
          v-for="event in events"
          :key="event"
          :model-value="data[event]"
          class="capitalize"
          @change="updateData({ [event]: $event })"
        >
          {{ event }}
        </ui-checkbox>
      </div>
    </div>
  </edit-interaction-base>
</template>
<script setup>
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const events = ['change', 'input', 'keyup', 'keydown'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
