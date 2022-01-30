<template>
  <ul class="space-y-4 mt-2">
    <li
      v-for="(element, index) in elements"
      :key="index"
      @mouseenter="$emit('highlight', { highlight: true, index, element })"
      @mouseleave="$emit('highlight', { highlight: false, index, element })"
    >
      <p
        class="mb-1 cursor-pointer"
        title="Scroll into view"
        @click="
          element.element.scrollIntoView({ block: 'center', inline: 'center' })
        "
      >
        #{{ index + 1 }} {{ elementName }}
      </p>
      <slot name="item" v-bind="{ element }" />
    </li>
  </ul>
</template>
<script setup>
defineProps({
  elements: {
    type: Array,
    default: () => [],
  },
  elementName: {
    type: String,
    default: 'Element',
  },
});
defineEmits(['highlight']);
</script>
