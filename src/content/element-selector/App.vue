<template>
  <div
    :class="{
      'select-none': state.isDragging,
      'bg-black bg-opacity-30': !state.hide,
    }"
    class="root fixed h-full w-full pointer-events-none top-0 text-gray-900 left-0"
    style="z-index: 9999999999; font-family: Inter, sans-serif; font-size: 16px"
  >
    <div
      ref="cardEl"
      :style="{ transform: `translate(${cardRect.x}px, ${cardRect.y}px)` }"
      style="width: 320px"
      class="absolute root-card bg-white shadow-xl z-50 p-4 pointer-events-auto rounded-lg"
    >
      <div
        class="absolute p-2 drag-button shadow-xl bg-white p-1 cursor-move rounded-lg"
        style="top: -15px; left: -15px"
      >
        <v-remixicon
          name="riDragMoveLine"
          @mousedown="state.isDragging = true"
        />
      </div>
      <div class="flex items-center">
        <p class="ml-1 text-lg font-semibold">Automa</p>
        <div class="flex-grow"></div>
        <ui-button icon class="mr-2" @click="state.hide = !state.hide">
          <v-remixicon :name="state.hide ? 'riEyeOffLine' : 'riEyeLine'" />
        </ui-button>
        <ui-button icon @click="destroy">
          <v-remixicon name="riCloseLine" />
        </ui-button>
      </div>
      <app-selector
        :selector="state.elSelector"
        :selected-count="state.selectedElements.length"
        @child="selectChildElement"
        @parent="selectParentElement"
        @change="updateSelectedElements"
      />
      <template v-if="!state.hide && state.selectedElements.length > 0">
        <ui-tabs v-model="state.activeTab" class="mt-2" fill>
          <ui-tab value="attributes"> Attributes </ui-tab>
          <ui-tab value="blocks"> Blocks </ui-tab>
        </ui-tabs>
        <ui-tab-panels
          v-model="state.activeTab"
          class="overflow-y-auto scroll"
          style="max-height: calc(100vh - 15rem)"
        >
          <ui-tab-panel value="attributes">
            <app-element-attributes
              :elements="state.selectedElements"
              @highlight="
                state.selectedElements[$event.index].highlight =
                  $event.highlight
              "
            />
          </ui-tab-panel>
          <ui-tab-panel value="blocks">
            <app-blocks
              :elements="state.selectedElements"
              :selector="state.elSelector"
              @execute="state.isExecuting = $event"
              @update="updateCardSize"
            />
          </ui-tab-panel>
        </ui-tab-panels>
      </template>
    </div>
    <svg
      v-if="!state.hide"
      class="h-full w-full absolute top-0 pointer-events-none left-0 z-10"
    >
      <rect
        v-bind="hoverElementRect"
        stroke-width="2"
        stroke="#fbbf24"
        fill="rgba(251, 191, 36, 0.2)"
      ></rect>
      <rect
        v-for="(item, index) in state.selectedElements"
        v-bind="item"
        :key="index"
        :stroke="item.highlight ? '#2563EB' : '#f87171'"
        :fill="
          item.highlight ? 'rgb(37, 99, 235, 0.2)' : 'rgba(248, 113, 113, 0.2)'
        "
        stroke-width="2"
      ></rect>
    </svg>
  </div>
</template>
<script setup>
import { reactive, ref, watch, inject, nextTick } from 'vue';
import { finder } from '@medv/finder';
import { debounce } from '@/utils/helper';
import AppBlocks from './AppBlocks.vue';
import AppSelector from './AppSelector.vue';
import AppElementAttributes from './AppElementAttributes.vue';

const selectedElement = {
  path: [],
  pathIndex: 0,
};
let lastScrollPosY = window.scrollY;
let lastScrollPosX = window.scrollX;

const rootElement = inject('rootElement');

const cardEl = ref('cardEl');
const state = reactive({
  activeTab: '',
  elSelector: '',
  isDragging: false,
  isExecuting: false,
  selectedElements: [],
  hide: window.self !== window.top,
});
const hoverElementRect = reactive({
  x: 0,
  y: 0,
  height: 0,
  width: 0,
});
const cardRect = reactive({
  x: 0,
  y: 0,
  height: 0,
  width: 0,
});

function getElementRect(target) {
  if (!target) return {};

  const { x, y, height, width } = target.getBoundingClientRect();

  return {
    width: width + 4,
    height: height + 4,
    x: x - 2,
    y: y - 2,
  };
}
function updateSelectedElements(selector) {
  state.elSelector = selector;

  try {
    const elements = document.querySelectorAll(selector);

    state.selectedElements = Array.from(elements).map((element) => {
      const attributes = Array.from(element.attributes).map(
        ({ name, value }) => ({ name, value })
      );

      return {
        element,
        attributes,
        highlight: false,
        ...getElementRect(element),
      };
    });
  } catch (error) {
    state.selectedElements = [];
  }
}
function handleMouseMove({ clientX, clientY, target }) {
  if (state.isDragging) {
    const height = window.innerHeight;
    const width = document.documentElement.clientWidth;

    if (clientY < 10) clientY = 0;
    else if (cardRect.height + clientY > height)
      clientY = height - cardRect.height;

    if (clientX < 10) clientX = 0;
    else if (cardRect.width + clientX > width) clientX = width - cardRect.width;

    cardRect.x = clientX;
    cardRect.y = clientY;

    return;
  }

  if (state.hide || rootElement === target) return;

  Object.assign(hoverElementRect, getElementRect(target));
}
function handleClick(event) {
  if (event.target === rootElement || state.hide || state.isExecuting) return;

  event.preventDefault();
  event.stopPropagation();

  const attributes = Array.from(event.target.attributes).map(
    ({ name, value }) => ({ name, value })
  );
  state.selectedElements = [
    {
      ...getElementRect(event.target),
      attributes,
      element: event.target,
      highlight: false,
    },
  ];
  state.elSelector = finder(event.target);

  selectedElement.index = 0;
  selectedElement.path = event.path;
}
function selectChildElement() {
  if (selectedElement.path.length === 0 || state.hide) return;

  const currentEl = selectedElement.path[selectedElement.pathIndex];
  let childElement = currentEl;

  if (selectedElement.pathIndex <= 0) {
    const childEl = Array.from(currentEl.children).find(
      (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
    );

    if (currentEl.childElementCount === 0 || currentEl === childEl) return;

    childElement = childEl;
    selectedElement.path.unshift(childEl);
  } else {
    selectedElement.pathIndex -= 1;
    childElement = selectedElement.path[selectedElement.pathIndex];
  }

  updateSelectedElements(finder(childElement));
}
function selectParentElement() {
  if (selectedElement.path.length === 0 || state.hide) return;

  const parentElement = selectedElement.path[selectedElement.pathIndex];

  if (parentElement.tagName === 'HTML') return;

  selectedElement.pathIndex += 1;

  updateSelectedElements(finder(parentElement));
}
function handleMouseUp() {
  if (state.isDragging) state.isDragging = false;
}
function updateCardSize() {
  setTimeout(() => {
    cardRect.height = cardEl.value.getBoundingClientRect().height;
  }, 250);
}
const handleScroll = debounce(() => {
  if (state.hide) return;

  const yPos = window.scrollY - lastScrollPosY;
  const xPos = window.scrollX - lastScrollPosX;

  state.selectedElements.forEach((_, index) => {
    state.selectedElements[index].x -= xPos;
    state.selectedElements[index].y -= yPos;
  });

  hoverElementRect.x -= xPos;
  hoverElementRect.y -= yPos;

  lastScrollPosX = window.scrollX;
  lastScrollPosY = window.scrollY;
}, 100);
function destroy() {
  rootElement.style.display = 'none';

  Object.assign(state, {
    activeTab: '',
    elSelector: '',
    isDragging: false,
    isExecuting: false,
    selectedElements: [],
  });
  Object.assign(hoverElementRect, {
    x: 0,
    y: 0,
    height: 0,
    width: 0,
  });
}

window.addEventListener('scroll', handleScroll);
window.addEventListener('mouseup', handleMouseUp);
window.addEventListener('mousemove', handleMouseMove);
document.addEventListener('click', handleClick, true);

watch(
  () => state.isDragging,
  (value) => {
    document.body.toggleAttribute('automa-isDragging', value);
  }
);
watch(() => [state.elSelector, state.activeTab, state.hide], updateCardSize);

nextTick(() => {
  setTimeout(() => {
    const { height, width } = cardEl.value.getBoundingClientRect();

    cardRect.x = window.innerWidth - (width + 35);
    cardRect.y = 20;
    cardRect.width = width;
    cardRect.height = height;
  }, 250);
});
</script>
<style>
.drag-button {
  transform: scale(0);
  transition: transform 200ms ease-in-out;
}
.root-card:hover .drag-button {
  transform: scale(1);
}
</style>
