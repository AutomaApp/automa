<template>
  <svg
    class="automa-element-highlighter"
    style="
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
      position: fixed;
      z-index: 10;
    "
  >
    <g v-for="(colors, key) in data" :key="key">
      <rect
        v-for="(item, index) in items[key]"
        v-bind="{
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          'stroke-dasharray': item.outline ? '5,5' : null,
          fill: getFillColor(item, colors),
          stroke: getStrokeColor(item, colors),
        }"
        :key="key + index"
        stroke-width="2"
      ></rect>
    </g>
  </svg>
</template>
<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { debounce } from '@/utils/helper';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  items: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

let lastScrollPosY = window.scrollY;
let lastScrollPosX = window.scrollX;

const handleScroll = debounce(() => {
  if (props.hide) return;

  const yPos = window.scrollY - lastScrollPosY;
  const xPos = window.scrollX - lastScrollPosX;

  const updatePositions = (key) =>
    props.items[key]?.map((item) => {
      const copyItem = { ...item };

      copyItem.x -= xPos;
      copyItem.y -= yPos;

      return copyItem;
    }) || [];

  Object.keys(props.data).forEach((key) => {
    const newPositions = updatePositions(key);
    emit('update', { key, items: newPositions });
  });

  lastScrollPosX = window.scrollX;
  lastScrollPosY = window.scrollY;
}, 100);

function getFillColor(item, colors) {
  if (item.outline) return null;

  return item.highlight ? colors.fill : colors.activeFill || colors.fill;
}
function getStrokeColor(item, colors) {
  return item.highlight ? colors.stroke : colors.activeStroke || colors.stroke;
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>
