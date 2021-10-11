<template>
  <div class="px-4 overflow-auto scroll pb-1">
    <div class="sticky top-0 z-20 bg-white border-b border-gray-100 pb-4 mb-4">
      <button class="mr-2 align-middle" @click="$emit('close')">
        <v-remixicon name="riArrowLeftLine" />
      </button>
      <p class="font-semibold inline-block align-middle">
        {{ data.name }}
      </p>
    </div>
    <component
      :is="data.editComponent"
      v-if="blockData"
      v-model:data="blockData"
    />
  </div>
</template>
<script>
import { computed } from 'vue';
import EditForms from './edit/EditForms.vue';
import EditTrigger from './edit/EditTrigger.vue';
import EditGetText from './edit/EditGetText.vue';
import EditTriggerEvent from './edit/EditTriggerEvent.vue';
import EditScrollElement from './edit/EditScrollElement.vue';
import EditAttributeValue from './edit/EditAttributeValue.vue';
import EditInteractionBase from './edit/EditInteractionBase.vue';

export default {
  components: {
    EditForms,
    EditTrigger,
    EditGetText,
    EditTriggerEvent,
    EditScrollElement,
    EditAttributeValue,
    EditInteractionBase,
  },
};
</script>
<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['close', 'update']);

const blockData = computed({
  get() {
    return props.data.data || {};
  },
  set(value) {
    emit('update', value);
  },
});
</script>
