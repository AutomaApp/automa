<template>
  <div class="flex items-center">
    <ui-button
      v-tooltip="'Previous page'"
      :disabled="modelValue <= 1"
      icon
      @click="updatePage(modelValue - 1)"
    >
      <v-remixicon name="riArrowLeftSLine" />
    </ui-button>
    <div class="mx-4">
      <input
        ref="inputEl"
        v-tooltip="'Current page'"
        :value="modelValue"
        :max="maxPage"
        min="0"
        class="
          p-2
          text-center
          transition
          w-10
          appearance-none
          bg-input
          rounded-lg
        "
        type="number"
        @click="$event.target.select()"
        @input="updatePage(+$event.target.value, $event.target)"
      />
      of
      {{ maxPage }}
    </div>
    <ui-button
      v-tooltip="'Next page'"
      :disabled="modelValue >= maxPage"
      icon
      @click="updatePage(modelValue + 1)"
    >
      <v-remixicon rotate="180" name="riArrowLeftSLine" />
    </ui-button>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  records: {
    type: Number,
    default: 10,
  },
  perPage: {
    type: Number,
    default: 10,
  },
});
const emit = defineEmits(['update:modelValue', 'paginate']);

const inputEl = ref(null);

const maxPage = computed(() => Math.round(props.records / props.perPage));

function emitEvent(page) {
  emit('update:modelValue', page);
  emit('paginate', page);
}
function updatePage(page, element) {
  let currentPage = page;

  if (currentPage > maxPage.value || currentPage < 1) {
    if (!element) return;

    currentPage = currentPage > maxPage.value ? maxPage.value : 1;
  }

  emitEvent(currentPage);
}

watch(
  () => [props.perPage, props.records],
  () => {
    emitEvent(1);
  }
);
</script>
<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
