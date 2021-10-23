<template>
  <div :aria-expanded="show" class="ui-expand">
    <button :class="headerClass" @click="toggleExpand">
      <v-remixicon
        :rotate="show ? 90 : -90"
        name="riArrowLeftSLine"
        class="mr-2 transition-transform -ml-1"
      />
      <slot name="header" />
    </button>
    <transition-expand>
      <div v-if="show" :class="panelClass" class="ui-expand__panel">
        <slot></slot>
      </div>
    </transition-expand>
  </div>
</template>
<script setup>
import { watch, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  panelClass: {
    type: String,
    default: '',
  },
  headerClass: {
    type: String,
    default: 'px-4 py-2 w-full flex items-center h-full',
  },
});
const emit = defineEmits(['update:modelValue']);

const show = ref(false);

function toggleExpand() {
  show.value = !show.value;

  emit('update:modelValue', show.value);
}

watch(
  () => props.modelValue,
  (value) => {
    if (value === show.value) return;

    show.value = value;
  },
  { immediate: true }
);
</script>
