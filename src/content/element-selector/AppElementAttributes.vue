<template>
  <ul class="space-y-4 mt-2">
    <li
      v-for="(element, index) in elements"
      :key="index"
      @mouseenter="$emit('highlight', { highlight: true, index })"
      @mouseleave="$emit('highlight', { highlight: false, index })"
    >
      <p
        class="mb-1 cursor-pointer"
        title="Scroll into view"
        @click="
          element.element.scrollIntoView({ block: 'center', inline: 'center' })
        "
      >
        #{{ index + 1 }} Element
      </p>
      <div
        v-for="attribute in element.attributes"
        :key="attribute.name"
        class="bg-box-transparent mb-1 rounded-lg py-2 px-3"
      >
        <p class="text-sm text-overflow leading-tight text-gray-600">
          {{ attribute.name }}
        </p>
        <p class="text-overflow">{{ attribute.value }}</p>
      </div>
    </li>
  </ul>
</template>
<script setup>
defineProps({
  elements: {
    type: Array,
    default: () => [],
  },
});
defineEmits(['highlight']);
</script>
