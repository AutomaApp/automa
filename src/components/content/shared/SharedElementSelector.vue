<template>
  <svg
    v-if="!disabled"
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
    <shared-element-highlighter
      :items="elementsState.hovered"
      stroke="#fbbf24"
      fill="rgba(251, 191, 36, 0.1)"
    />
    <shared-element-highlighter
      :items="elementsState.selected"
      stroke="#2563EB"
      active-stroke="#f87171"
      fill="rgba(37, 99, 235, 0.1)"
      active-fill="rgba(248, 113, 113, 0.1)"
    />
  </svg>
  <teleport to="body">
    <div
      v-if="!disabled"
      style="
        z-index: 9999999;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      "
    ></div>
  </teleport>
</template>
<script setup>
import { reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import { finder } from '@medv/finder';
import { generateXPath } from '@/content/utils';
import findElementList from '@/content/elementSelector/listSelector';
import generateElementsSelector from '@/content/elementSelector/generateElementsSelector';
import SharedElementHighlighter from './SharedElementHighlighter.vue';

const props = defineProps({
  selectorType: {
    type: String,
    default: 'css',
  },
  list: Boolean,
  disabled: Boolean,
});
const emit = defineEmits(['selected']);

let frameElement = null;

let hoveredElements = [];
const elementsState = reactive({
  hovered: [],
  selected: [],
});

function onScroll() {
  hoveredElements = [];
  elementsState.hoveredElements = [];
}
function resetFramesElements(options = {}) {
  const elements = document.querySelectorAll('iframe, frame');

  elements.forEach((element) => {
    element.contentWindow.postMessage(
      {
        ...options,
        type: 'automa:reset-element-selector',
      },
      '*'
    );
  });
}
function getElementRect(target, withElement = false) {
  if (!target) return {};

  const { x, y, height, width } = target.getBoundingClientRect();
  const result = {
    width: width + 4,
    height: height + 4,
    x: x - 2,
    y: y - 2,
  };

  if (withElement) result.element = target;

  return result;
}
function retrieveElementsRect({ clientX, clientY, target: eventTarget }, type) {
  const isAutomaContainer = eventTarget.classList.contains(
    'automa-element-selector'
  );
  if (props.disabled || isAutomaContainer) return;

  const isSelectList = props.list && props.selectorType === 'css';

  let { 1: target } = document.elementsFromPoint(clientX, clientY);
  if (target.tagName === 'IFRAME' || target.tagName === 'FRAME') {
    const prevSelectedList = document.querySelectorAll('[automa-el-list]');
    prevSelectedList.forEach((el) => {
      el.removeAttribute('automa-el-list');
    });

    if (target.contentDocument) {
      target = target.contentDocument.elementsFromPoint(clientX, clientY);
    } else {
      const { top, left } = target.getBoundingClientRect();
      const payload = {
        top,
        left,
        clientX,
        clientY,
        list: isSelectList,
        type: 'automa:get-element-rect',
      };

      if (type === 'selected')
        Object.assign(payload, {
          click: true,
          selectorType: props.selectorType,
        });

      target.contentWindow.postMessage(payload, '*');
    }

    frameElement = target;

    return;
  }

  frameElement = null;
  let elementsRect = [];

  if (isSelectList) {
    const elements = findElementList(target) || [];

    if (type === 'hovered') hoveredElements = elements;

    elementsRect = elements.map((el) => getElementRect(el));
  } else {
    if (type === 'hovered') hoveredElements = [target];

    elementsRect = [getElementRect(target)];
  }

  elementsState[type] = elementsRect;

  if (type === 'selected') {
    resetFramesElements();

    const selector = generateElementsSelector({
      target,
      hoveredElements,
      list: isSelectList,
      selectorType: props.selectorType,
    });
    console.log(selector);
  }
}
function onMousemove(event) {
  retrieveElementsRect(event, 'hovered');
}
function onClick(event) {
  retrieveElementsRect(event, 'selected');
}
function onMessage({ data }) {
  if (data.type !== 'automa:iframe-element-rect') return;

  if (data.click) {
    const frameSelector =
      props.selectorType === 'css'
        ? finder(frameElement, { tagName: () => true })
        : generateXPath(frameElement);

    emit('selected', `${frameSelector} |> ${data.selector}`);
  }

  const key = data.click ? 'selected' : 'hovered';
  elementsState[key] = data.elements;
}
function attachListeners() {
  window.addEventListener('scroll', onScroll);
  window.addEventListener('message', onMessage);
  window.addEventListener('mousemove', onMousemove);
  document.addEventListener('click', onClick, true);
}
function detachListeners() {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('message', onMessage);
  window.removeEventListener('mousemove', onMousemove);
  document.removeEventListener('click', onClick, true);
}

watch(
  () => [props.list, props.disabled],
  () => {
    resetFramesElements({ clearCache: true });
  }
);

onMounted(attachListeners);
onBeforeUnmount(detachListeners);
</script>
