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
      label="Typing delay (millisecond)(0 to disable)"
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
          :key="event.id"
          :model-value="data[event.id]"
          class="capitalize"
          @change="updateData({ [event.id]: $event })"
        >
          {{ event.name }}
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

const events = [
  { id: 'changeEvent', name: 'Change' },
  { id: 'inputEvent', name: 'input' },
  { id: 'keyupEvent', name: 'keyup' },
  { id: 'keydownEvent', name: 'keydown' },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
