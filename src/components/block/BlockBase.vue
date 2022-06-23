<template>
  <div class="block-base relative w-48" @dblclick="$emit('edit')">
    <slot name="prepend" />
    <ui-card :class="contentClass" class="z-10 relative block-base__content">
      <slot></slot>
    </ui-card>
    <slot name="append" />
    <div
      v-if="!minimap"
      class="absolute bottom-1 transition-transform duration-300 pt-4 ml-1 menu"
    >
      <div
        class="bg-accent dark:bg-gray-100 dark:text-black px-3 py-2 text-white rounded-lg flex items-center"
      >
        <button v-if="!hideEdit" @click="$emit('edit')">
          <v-remixicon size="20" name="riPencilLine" />
        </button>
        <hr
          v-if="!hideDelete && !hideEdit"
          class="border-r border-gray-600 h-5 mx-3"
        />
        <button v-if="!hideDelete" @click.stop="$emit('delete')">
          <v-remixicon size="20" name="riDeleteBin7Line" />
        </button>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({
  hideDelete: {
    type: Boolean,
    default: false,
  },
  minimap: {
    type: Boolean,
    default: false,
  },
  hideEdit: {
    type: Boolean,
    default: false,
  },
  contentClass: {
    type: String,
    default: '',
  },
});
defineEmits(['delete', 'edit']);
</script>
