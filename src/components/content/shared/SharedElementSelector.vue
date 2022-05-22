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
import { debounce } from '@/utils/helper';
import { generateXPath, getElementPath, getElementRect } from '@/content/utils';
import findElementList from '@/content/elementSelector/listSelector';
import generateElementsSelector from '@/content/elementSelector/generateElementsSelector';
import SharedElementHighlighter from './SharedElementHighlighter.vue';

const props = defineProps({
  selectorType: {
    type: String,
    default: 'css',
  },
  selectedEls: {
    type: Array,
    default: () => [],
  },
  list: Boolean,
  disabled: Boolean,
  withAttributes: Boolean,
});
const emit = defineEmits(['selected']);

let frameElement = null;
let lastScrollPosY = window.scrollY;
let lastScrollPosX = window.scrollX;

let hoveredElements = [];
const elementsState = reactive({
  hovered: [],
  selected: [],
});

const onScroll = debounce(() => {
  if (state.hide) return;

  hoveredElements = [];
  elementsState.selected = [];

  const yPos = window.scrollY - lastScrollPosY;
  const xPos = window.scrollX - lastScrollPosX;

  state.selected.forEach((_, index) => {
    state.selected[index].x -= xPos;
    state.selected[index].y -= yPos;
  });

  lastScrollPosX = window.scrollX;
  lastScrollPosY = window.scrollY;
}, 100);
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
function retrieveElementsRect({ clientX, clientY, target: eventTarget }, type) {
  const isAutomaContainer = eventTarget.classList.contains(
    'automa-element-selector'
  );
  if (props.disabled || isAutomaContainer) return;

  const isSelectList = props.list && props.selectorType === 'css';

  let { 1: target } = document.elementsFromPoint(clientX, clientY);
  if (target.tagName === 'IFRAME' || target.tagName === 'FRAME') {
    if (type === 'selected') {
      const prevSelectedList = document.querySelectorAll('[automa-el-list]');
      prevSelectedList.forEach((el) => {
        el.removeAttribute('automa-el-list');
      });
    }

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
        withAttributes: props.withAttributes,
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
  const withAttribute = props.withAttributes && type === 'selected';

  if (isSelectList) {
    const elements = findElementList(target) || [];

    if (type === 'hovered') hoveredElements = elements;

    elementsRect = elements.map((el) => getElementRect(el, withAttribute));
  } else {
    if (type === 'hovered') hoveredElements = [target];

    elementsRect = [getElementRect(target, withAttribute)];
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
    emit('selected', {
      selector,
      elements: elementsRect,
      path: getElementPath(target),
    });
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

    emit('selected', {
      elements: data.elements,
      selector: `${frameSelector} |> ${data.selector}`,
    });
  }

  const key = data.click ? 'selected' : 'hovered';
  elementsState[key] = data.elements;
}
function attachListeners() {
  window.addEventListener('scroll', onScroll);
  document.addEventListener('click', onClick);
  window.addEventListener('message', onMessage);
  window.addEventListener('mousemove', onMousemove);
}
function detachListeners() {
  window.removeEventListener('scroll', onScroll);
  document.removeEventListener('click', onClick);
  window.removeEventListener('message', onMessage);
  window.removeEventListener('mousemove', onMousemove);
}

watch(
  () => [props.list, props.disabled],
  () => {
    resetFramesElements({ clearCache: true });
  }
);
watch(
  () => props.selectedEls,
  () => {
    elementsState.selected = props.selectedEls;
  }
);

onMounted(attachListeners);
onBeforeUnmount(detachListeners);
</script>
