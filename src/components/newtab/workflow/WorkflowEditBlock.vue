<template>
  <div class="px-4">
    <div>
      <button class="mr-2 align-middle" @click="$emit('close')">
        <v-remixicon name="riArrowLeftLine" />
      </button>
      <p class="font-semibold inline-block align-middle">
        {{ data.name }}
      </p>
    </div>
    <hr class="mb-4 mt-5 w-full border-gray-100" />
    <component :is="data.editComponent" v-model:data="blockData" />
  </div>
</template>
<script>
import { computed } from 'vue';
import EditTrigger from './edit/EditTrigger.vue';

export default {
  components: { EditTrigger },
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
